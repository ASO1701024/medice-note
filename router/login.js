const Router = require('koa-router');
const router = new Router();
const connection = require('../app/db');
const app = require('../app/app');
const bcrypt = require('bcrypt');
const {v4: uuid} = require('uuid');
const transporter = require('../app/mail');
const config = require('../config.json');

router.get('/login', async (ctx) => {
    // Session
    let session = ctx.session;
    app.initializeSession(session);

    // Login Check
    let authId = session.auth_id;
    let userId = await app.getUserId(authId);
    if (userId) {
        session.error.message = '既にログインしています';

        return ctx.redirect('/');
    }

    // Render
    let result = app.initializeRenderResult();
    result['data']['meta']['login_status'] = false;
    result['data']['meta']['site_title'] = 'ログイン - Medice Note';
    result['data']['meta']['seo']['bool'] = true;
    result['data']['meta']['seo']['description'] = 'Medice Noteにログイン';
    result['data']['meta']['seo']['url'] = 'https://www.medice-note.vxx0.com/login';

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

router.post('/login', async (ctx) => {
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

    sql = 'DELETE FROM session WHERE expired_at <= ?';
    await connection.query(sql, [new Date()]);

    // Lookup Account
    sql = 'SELECT user_id, mail, password, is_enable FROM user WHERE mail = ? AND deleted_at IS NULL';
    let [user] = await connection.query(sql, [mail]);
    if (user.length === 0) {
        session.error.message = 'アカウントが見つかりませんでした';

        return ctx.redirect('/login');
    }

    user = user[0];
    if (user['is_enable'] === 0) {
        session.error.no_escape = 'メールアドレス認証が行われていません<a href="/renew-mail-auth" class="alert-link">こちら</a>からメールアドレス認証を行ってください';

        return ctx.redirect('/login');
    } else {
        let hashPassword = user['password'];
        if (bcrypt.compareSync(password, hashPassword)) {
            let authKey = uuid() + uuid() + uuid()
            authKey = authKey.split('-').join('')

            sql = 'INSERT INTO user_two_factor_authentication VALUES (?, ?, DATE_ADD(NOW(), INTERVAL 10 MINUTE))';
            await connection.query(sql, [user['user_id'], authKey]);

            await transporter.sendMail({
                from: config.mail.auth.user,
                to: user['mail'],
                subject: '二段階認証',
                text: '登録されているメールアドレスにログインリクエストが行われました\n' +
                    'アカウントにログインするには以下のURLをクリックしてください\n' +
                    'https://www.medice-note.vxx0.com/two-factor-authentication/' + authKey
            }).then(() => {
                session.success.message = '認証メールを送信しました';

                ctx.redirect('/login');
            }).catch(() => {
                session.error.message = '認証メールの送信に失敗しました';

                ctx.redirect('/login');
            });
        } else {
            session.error.message = 'ログインに失敗しました';

            return ctx.redirect('/login');
        }

        return ctx.redirect('/login');
    }
})

module.exports = router;
