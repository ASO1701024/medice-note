const Router = require('koa-router');
const router = new Router();
const connection = require('../app/db');
const validator = require('validatorjs');
const bcrypt = require('bcrypt');
const {v4: uuid} = require('uuid');
const app = require('../app/app');
const transporter = require('../app/mail');
const config = require('../config.json');

router.get('/signup', async (ctx) => {
    let session = ctx.session;
    app.initializeSession(session);

    let authId = session.auth_id;
    let userId = await app.getUserId(authId);
    if (userId) {
        session.error.message = '既にログインしています';

        return ctx.redirect('/');
    }

    let result = app.initializeRenderResult();
    result['data']['meta']['login_status'] = false;
    result['data']['meta']['site_title'] = 'アカウント登録 - Medice Note';

    if (session.success !== undefined) {
        result['data']['success'] = session.success;
        session.success = undefined;
    }

    if (session.error !== undefined) {
        result['data']['error'] = session.error;
        session.error = undefined;
    }

    await ctx.render('signup', result);
})

router.post('/signup', async (ctx) => {
    let session = ctx.session;
    app.initializeSession(session);

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

        return ctx.redirect('/signup');
    }

    // 重複
    let sql = 'SELECT user_id FROM user WHERE mail = ?';
    let [result] = await connection.query(sql, [mail]);

    if (result.length !== 0) {
        session.error.mail = '既に登録されているメールアドレスです';

        return ctx.redirect('/signup');
    }

    sql = 'INSERT INTO user (user_name, mail, password) VALUES (?, ?, ?)';
    let [user] = await connection.query(sql, [userName, mail, bcrypt.hashSync(password, 10)]);

    let userId = user.insertId;
    let authKey = uuid().split('-').join('');

    let date = new Date();
    date.setHours(date.getHours() + 24);
    await connection.query('INSERT INTO user_authentication_key VALUES(?, ?, ?)', [userId, authKey, date]);

    sql = 'INSERT INTO medicine_group (group_name, user_id, is_deletable) VALUES (?, ?, ?)';
    await connection.query(sql, ['デフォルト', userId, true]);

    await transporter.sendMail({
        from: config.mail.auth.user,
        to: mail,
        subject: 'メールアドレス認証',
        text: '登録いただきありがとうございます\n' +
            'アカウントを有効化するには下記のURLにアクセスしメールアドレスを認証してください\n' +
            'https://www.medice-note.vxx0.com/auth-mail/' + authKey
    }).then(() => {
        session.success.message = '認証メールを送信しました';

        ctx.redirect('/signup');
    }).catch(() => {
        session.error.message = '認証メールの送信に失敗しました';

        ctx.redirect('/signup');
    });
})

module.exports = router;
