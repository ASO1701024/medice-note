const Router = require('koa-router');
const router = new Router();
const connection = require('../app/db');
const app = require('../app/app');

router.get('/auth-mail/:auth_key', async (ctx) => {
    let session = ctx.session;
    app.initializeSession(session);

    let authKey = ctx.params['auth_key'];
    let date = new Date();

    let sql = 'SELECT user_id FROM user_authentication_key WHERE authentication_key = ? AND expires_at >= ?';
    let [auth] = await connection.query(sql, [authKey, date]);
    if (auth.length === 0) {
        session.error.message = '認証キーが見つかりませんでした';

        return ctx.redirect('/login');
    }

    let userId = auth[0]['user_id'];
    sql = 'UPDATE user SET is_enable = 1 WHERE user_id = ?';
    await connection.query(sql, [userId]);

    sql = 'DELETE FROM user_authentication_key WHERE authentication_key = ?';
    await connection.query(sql, [authKey]);

    session.success.message = 'メールアドレスを認証しました';

    return ctx.redirect('/login');
})

module.exports = router;
