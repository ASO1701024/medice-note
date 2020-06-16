const Router = require('koa-router');
const router = new Router();
const app = require('../app/app');
const connection = require('../app/db');
const validator = require('validatorjs');
const bcrypt = require('bcrypt');

router.get('/account-edit', async (ctx) => {
    let session = ctx.session;
    app.initializeSession(session);

    let authId = session.auth_id;
    let userId = await app.getUserId(authId);
    if (!authId || !userId) {
        return ctx.redirect('/');
    }

    let result = app.initializeRenderResult();
    result['data']['meta']['login_status'] = true;
    result['data']['meta']['site_title'] = 'アカウント情報変更 - Medice Note';

    let sql = 'SELECT user_name, mail FROM user WHERE user_id = ?';
    let [user] = await connection.query(sql, [userId]);
    result['data']['account'] = {};
    result['data']['account']['user_name'] = user[0]['user_name'];
    result['data']['account']['mail'] = user[0]['mail'];

    if (session.success !== undefined) {
        result['data']['success'] = session.success;
        session.success = undefined;
    }

    if (session.error !== undefined) {
        result['data']['error'] = session.error;
        session.error = undefined;
    }

    await ctx.render('account-edit', result);
})

router.post('/account-edit', async (ctx) => {
    // Session
    let session = ctx.session;
    app.initializeSession(session);

    // Login Check
    let authId = session.auth_id;
    let userId = await app.getUserId(authId);
    if (!authId || !userId) {
        return ctx.redirect('/login');
    }

    let userName = ctx.request.body['user_name'];
    let mail = ctx.request.body['mail'];
    let password = ctx.request.body['password'];

    // Validation
    let userNameValidate = new validator({
        userName: userName
    }, {
        userName: 'required|string|min:1|max:20'
    });
    let mailValidate = new validator({
        mail: mail
    }, {
        mail: 'required|email|max:100'
    });
    let passwordValidate = new validator({
        password: password
    }, {
        password: 'required|string|min:5|max:100'
    });
    if (userNameValidate.fails() || mailValidate.fails() || passwordValidate.fails()) {
        if (userNameValidate.fails()) session.error.user_name = '1文字以上20文字以下で入力';
        if (mailValidate.fails()) session.error.mail = '100文字以下のメールアドレスを入力';
        if (passwordValidate.fails()) session.error.password = '5文字以上100文字以下で入力';

        return ctx.redirect('/account-edit');
    }

    let sql = 'SELECT user_id FROM user WHERE mail = ? AND user_id != ?';
    let [result] = await connection.query(sql, [mail, userId]);
    if (result.length !== 0) {
        session.error.mail = '既に登録されているメールアドレスです';

        return ctx.redirect('/account-edit');
    }

    sql = 'UPDATE user SET user_name = ?, mail = ?, password = ? WHERE user_id = ?';
    await connection.query(sql, [userName, mail, bcrypt.hashSync(password, 10), userId]);

    session.success.message = 'アカウント情報を変更しました';

    ctx.redirect('/account-edit');
})

module.exports = router;