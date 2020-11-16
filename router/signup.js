const Router = require('koa-router');
const router = new Router();
const connection = require('../app/db');
const validator = require('validatorjs');
const bcrypt = require('bcrypt');
const {v4: uuid} = require('uuid');
const app = require('../app/app');
const transporter = require('../app/mail');
const config = require('../config.json');
const fs = require('fs');
const path = require('path');
const Handlebars = require('handlebars');

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
    result['data']['meta']['seo']['bool'] = true;
    result['data']['meta']['seo']['description'] = 'Medice Noteに登録';
    result['data']['meta']['seo']['url'] = 'https://www.medice-note.vxx0.com/signup';

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
    let sql = 'SELECT is_enable FROM user WHERE mail = ?';
    let [result] = await connection.query(sql, [mail]);

    if (result.length !== 0) {
        if (result[0]['is_enable'] === 0) {
            session.error.no_escape = 'メールアドレス認証が行われていません<a href="/renew-mail-auth" class="alert-link">こちら</a>からメールアドレス認証を行ってください';
        } else {
            session.error.mail = '既に登録されているメールアドレスです';
        }

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

    let data = fs.readFileSync(path.join(__dirname, '../view/email/auth-template.html'), 'utf-8')
    let template = Handlebars.compile(data);
    let html = template({
        title: 'メールアドレス認証',
        message: '登録いただきありがとうございます<br>アカウントを有効化するにはメールアドレスを認証してください',
        url: `https://www.medice-note.vxx0.com/auth-mail/${authKey}`
    })
    await transporter.sendMail({
        from: config.mail.auth.user,
        to: mail,
        subject: 'メールアドレス認証',
        html: html
    }).then(() => {
        session.success.message = '認証メールを送信しました';

        return ctx.redirect('/signup');
    }).catch(() => {
        session.error.message = '認証メールの送信に失敗しました';

        return ctx.redirect('/signup');
    });
})

module.exports = router;
