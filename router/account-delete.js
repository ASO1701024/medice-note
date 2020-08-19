const Router = require('koa-router');
const router = new Router();
const app = require('../app/app');
const connection = require('../app/db');
const bcrypt = require('bcrypt');

router.get('/account-delete', async (ctx) => {
    let session = ctx.session;
    app.initializeSession(session);

    let authId = session.auth_id;
    let userId = await app.getUserId(authId);
    if (!userId) {
        session.error.message = 'ログインしていないため続行できませんでした';

        return ctx.redirect('/login');
    }

    let result = app.initializeRenderResult();
    result['data']['meta']['login_status'] = true;
    result['data']['meta']['site_title'] = 'アカウント情報削除 - Medice Note';
    result['data']['meta']['group_list'] = await app.getGroupList(userId);

    if (session.error !== undefined) {
        result['data']['error'] = session.error;
        session.error = undefined;
    }

    await ctx.render('account-delete', result);
})

router.post('/account-delete', async (ctx) => {
    // Session
    let session = ctx.session;
    app.initializeSession(session);

    // Login Check
    let authId = session.auth_id;
    let userId = await app.getUserId(authId);
    if (!userId) {
        session.error.message = 'ログインしていないため続行できませんでした';

        return ctx.redirect('/login');
    }

    let password = ctx.request.body['password'];

    let sql = 'SELECT password FROM user WHERE user_id = ?';
    let [user] = await connection.query(sql, [userId]);
    let hashPassword = user[0]['password'];
    if (!bcrypt.compareSync(password, hashPassword)) {
        session.error.message = 'パスワード認証に失敗しました';

        return ctx.redirect('/account-delete');
    }

    sql = 'UPDATE user SET deleted_at = ? WHERE user_id = ?';
    await connection.query(sql, [new Date(), userId]);

    sql = 'DELETE FROM session WHERE user_id = ?';
    await connection.query(sql, [userId]);

    session.success.message = 'アカウントを削除しました';
    session.auth_id = undefined;
    session.error = undefined;
    session.old = undefined;

    ctx.redirect('/login');
})

module.exports = router;