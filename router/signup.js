const Router = require('koa-router');
const router = new Router();
const connection = require('../app/db');
const validator = require('validatorjs');
const bcrypt = require('bcrypt');
const { v4: uuid } = require('uuid');
const transporter = require('../app/mail');
const config = require('../config.json');

router.get('/signup', async (ctx, next) => {
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

    if (session.error_user_name !== undefined) {
        result['data']['error_user_name'] = session.error_user_name;
        session.error_user_name = undefined;
    }

    if (session.error_mail !== undefined) {
        result['data']['error_mail'] = session.error_mail;
        session.error_mail = undefined;
    }

    if (session.error_password !== undefined) {
        result['data']['error_password'] = session.error_password;
        session.error_password = undefined;
    }

    await ctx.render('signup', result);
})

router.post('/signup', async (ctx, next) => {
    let session = ctx.session;

    let userName = ctx.request.body.user_name;
    let mail = ctx.request.body.mail;
    let password = ctx.request.body.password;

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
        if (userNameValidate.fails()) session.error_user_name = '1文字以上20文字以下で入力';
        if (mailValidate.fails()) session.error_mail = '100文字以下のメールアドレスを入力';
        if (passwordValidate.fails()) session.error_password = '5文字以上100文字以下で入力';

        ctx.redirect('/signup');
    }

    // 重複
    let sql = 'SELECT user_id FROM user WHERE mail = ?';
    let [result] = await connection.query(sql, [mail]);

    if (result.length !== 0) {
        session.error_mail = '既に登録されているメールアドレスです';

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
        session.success_message = '認証メールを送信しました';
    }).catch(() => {
        session.error_message = '認証メールの送信に失敗しました';
    });

    ctx.redirect('/signup')
})

module.exports = router;
