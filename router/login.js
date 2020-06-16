const Router = require('koa-router');
const router = new Router();
const connection = require('../app/db');
const app = require('../app/app');
const bcrypt = require('bcrypt');
const { v4: uuid } = require('uuid');

router.get('/login', async (ctx, next) => {
    // Session
    let session = ctx.session;
    app.initializeSession(session);

    // Login Check
    let authId = session.auth_id;
    let userId = await app.getUserId(authId);
    if (authId || userId) {
        session.error.message = '既にログインしています';

        return ctx.redirect('/');
    }

    // Render
    let result = app.initializeRenderResult();
    result['data']['meta']['site_title'] = 'お問い合わせ - Medice Note';

    if (session.success !== undefined) {
        result['data']['success'] = session.success;
        session.success = undefined;
    }

    if (session.error !== undefined) {
        result['data']['error'] = session.error;
        session.error = undefined;
    }

    await ctx.render('login', result);
})

router.post('/login', async (ctx, next) => {
    let session = ctx.session;
    app.initializeSession(session);

    let mail = ctx.request.body['mail'];
    let password = ctx.request.body['password'];

    // Login Log
    let sql = 'INSERT INTO user_login_log (mail, user_agent, ip_address, login_at) VALUES (?, ?, ?, ?)';
    await connection.query(sql, [
        mail,
        ctx.request.headers['user-agent'],
        ctx.request.ip,
        new Date()
    ]);

    // Lookup Account
    sql = 'SELECT user_id, password, is_enable FROM user WHERE mail = ? AND deleted_at IS NULL';
    let [user] = await connection.query(sql, [mail]);
    if (user.length === 0) {
        session.error.message = 'アカウントが見つかりませんでした';

        return ctx.redirect('/login');
    }

    user = user[0];
    if (user['is_enable'] === false) {
        session.error.message = 'メールアドレスが認証されていません';
    } else {
        let hashPassword = user['password'];
        if (bcrypt.compareSync(password, hashPassword)) {
            let sessionId = uuid().split('-').join('');
            let date = new Date();
            date.setDate(date.getDate() + 30);

            sql = "INSERT INTO session VALUES (?, ?, ?)";
            await connection.query(sql, [user['user_id'], sessionId, date]);

            session.auth_id = sessionId;

            return ctx.redirect('/');
        } else {
            session.error.message = 'ログインに失敗しました';
        }
    }

    ctx.redirect('/login');
})

module.exports = router;
