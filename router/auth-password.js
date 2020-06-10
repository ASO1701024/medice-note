const Router = require('koa-router');
const router = new Router();
const connection = require('../app/db');
const validator = require('validatorjs');
const bcrypt = require('bcrypt');

router.get('/auth-password/:auth_key', async (ctx, next) => {
    let session = ctx.session;

    let authKey = ctx.params.auth_key;

    let sql = 'SELECT * FROM user_reset_password_key WHERE reset_password_key = ? AND expires_at >= ?';
    let [auth] = await connection.query(sql, [authKey, new Date()]);
    if (auth.length === 0) {
        session.error_message = '認証キーが見つかりませんでした';

        return ctx.redirect('/forgot-password');
    }

    let result = {};
    result['data'] = {};

    result['data']['auth_key'] = authKey;

    if (session.success_message !== undefined) {
        result['data']['success_message'] = session.success_message;
        session.success_message = undefined;
    }

    if (session.error_message !== undefined) {
        result['data']['error_message'] = session.error_message;
        session.error_message = undefined;
    }

    await ctx.render('auth-password', result);
});

router.post('/auth-password/:auth_key', async (ctx, next) => {
    let session = ctx.session;

    let authKey = ctx.params.auth_key;
    let password = ctx.request.body.password;
    let passwordVerify = ctx.request.body.password_verify;

    let sql = 'SELECT * FROM user_reset_password_key WHERE reset_password_key = ? AND expires_at >= ?';
    let [auth] = await connection.query(sql, [authKey, new Date()]);
    if (auth.length === 0) {
        session.error_message = '認証キーが見つかりませんでした';

        return ctx.redirect('/forgot-password');
    }

    if (password !== passwordVerify) {
        session.error_message = 'パスワードが異なっています';

        return ctx.redirect('/auth-password/' + authKey);
    }

    let passwordValidate = new validator({
        password: password
    }, {
        password: 'required|string|min:5|max:100'
    });

    if (passwordValidate.fails()) {
        session.error_password = '5文字以上100文字以下で入力';

        return ctx.redirect('/auth-forgot/' + authKey);
    }

    let userId = auth[0].user_id;
    sql = 'UPDATE user SET password = ? WHERE user_id = ?';
    await connection.query(sql, [bcrypt.hashSync(password, 10), userId]);

    sql = 'DELETE FROM user_reset_password_key WHERE reset_password_key = ?';
    await connection.query(sql, [authKey]);

    session.success_message = 'パスワードを変更しました';

    ctx.redirect('/login');
});

module.exports = router;