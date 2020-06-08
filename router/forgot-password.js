const Router = require('koa-router');
const router = new Router();
const connection = require('../app/db');
const { v4: uuid } = require('uuid');
const transporter = require('../app/mail');
const config = require('../config.json');

router.get('/forgot-password', async (ctx, next) => {
    let session = ctx.session;

    let result = {};
    result['data'] = {};

    if (session.success_message !== undefined) {
        result['data']['success_message'] = session.success_message;
        session.success_message = undefined;
    }

    if (session.error_message !== undefined) {
        result['data']['error_message'] = session.error_message;
        session.error_message = undefined;
    }

    await ctx.render('forgot-password', result);
});

router.post('/forgot-password', async (ctx, next) => {
    let session = ctx.session;

    let mail = ctx.request.body.mail;

    let sql = 'SELECT user_id FROM user WHERE mail = ? AND is_enable = true AND deleted_at IS NULL';
    let [user] = await connection.query(sql, [mail]);
    if (user.length === 0) {
        session.error_message = 'アカウントが見つかりませんでした';

        return ctx.redirect('/forgot-password');
    }

    let userId = user[0].user_id;
    let authKey = uuid().split('-').join('') + uuid().split('-').join('');
    let date = new Date();
    date.setHours(date.getHours() + 24);
    await connection.query('INSERT INTO user_reset_password_key VALUES(?, ?, ?)', [userId, authKey, date]);

    await transporter.sendMail({
        from: config.mail.auth.user,
        to: mail,
        subject: 'パスワード再発行',
        text: 'パスワード再発行リクエストが行われました\n' +
            'パスワードを復元するには下記のURLにアクセスしメールアドレスを認証してください\n' +
            'https://www.medice-note.vxx0.com/auth-password/' + authKey
    }, function (error) {
        if (error) {
            session.error_message = '認証メールの送信に失敗しました';
        } else {
            session.success_message = '認証メールを送信しました';
        }
    });

    return ctx.redirect('/forgot-password');
});

module.exports = router;
