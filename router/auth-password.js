const Router = require('koa-router');
const router = new Router();
const connection = require('../app/db');
const app = require('../app/app');
const validator = require('validatorjs');
const bcrypt = require('bcrypt');

router.get('/auth-password/:auth_key', async (ctx, next) => {
    let session = ctx.session;
    app.initializeSession(session);

    let authKey = ctx.params['auth_key'];

    let sql = 'SELECT * FROM user_reset_password_key WHERE reset_password_key = ? AND expires_at >= ?';
    let [auth] = await connection.query(sql, [authKey, new Date()]);
    if (auth.length === 0) {
        session.error.message = '認証キーが見つかりませんでした';

        return ctx.redirect('/forgot-password');
    }

    let result = app.initializeRenderResult();
    result['data']['meta']['login_status'] = false;
    result['data']['meta']['site_title'] = 'パスワード再発行 - Medice Note';
    result['data']['auth_key'] = authKey;

    if (session.success !== undefined) {
        result['data']['success'] = session.success;
        session.success = undefined;
    }

    if (session.error !== undefined) {
        result['data']['error'] = session.error;
        session.error = undefined;
    }

    await ctx.render('auth-password', result);
});

router.post('/auth-password/:auth_key', async (ctx, next) => {
    let session = ctx.session;
    app.initializeSession(session);

    let authKey = ctx.params['auth_key'];
    let password = ctx.request.body['password'];
    let passwordVerify = ctx.request.body['password_verify'];

    let sql = 'SELECT * FROM user_reset_password_key WHERE reset_password_key = ? AND expires_at >= ?';
    let [auth] = await connection.query(sql, [authKey, new Date()]);
    if (auth.length === 0) {
        session.error.message = '認証キーが見つかりませんでした';

        return ctx.redirect('/forgot-password');
    }

    if (password !== passwordVerify) {
        session.error.message = 'パスワードが異なっています';

        return ctx.redirect('/auth-password/' + authKey);
    }

    let passwordValidate = new validator({
        password: password
    }, {
        password: 'required|string|min:5|max:100'
    });

    if (passwordValidate.fails()) {
        session.error.password = '5文字以上100文字以下で入力';

        return ctx.redirect('/auth-password/' + authKey);
    }

    let userId = auth[0].user_id;
    sql = 'UPDATE user SET password = ? WHERE user_id = ?';
    await connection.query(sql, [bcrypt.hashSync(password, 10), userId]);

    sql = 'DELETE FROM user_reset_password_key WHERE reset_password_key = ?';
    await connection.query(sql, [authKey]);

    session.success.message = 'パスワードを変更しました';

    ctx.redirect('/login');
});

module.exports = router;