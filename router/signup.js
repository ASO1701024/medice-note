const Router = require('koa-router');
const router = new Router();
// const mysql = require('mysql');
const connection = require('../db');
const validator = require('validatorjs');
const bcrypt = require('bcrypt');
// const session = require('koa-generic-session');
// const SQLite3Store = require('koa-sqlite3-session');

router.get('/signup', async (ctx, next) => {
    let session = ctx.session;
    console.log(session);

    let result = {};

    if (session.error_user_name !== undefined) {
        result['error_user_name'] = session.error_user_name;
        session.error_user_name = undefined;
    }

    if (session.error_mail !== undefined) {
        result['error_mail'] = session.error_mail;
        session.error_mail = undefined;
    }

    if (session.error_password !== undefined) {
        result['error_password'] = session.error_password;
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
    let test = 'test1';
    console.log('test1 > ' + test);

    let sql = 'SELECT user_id FROM user WHERE mail = ?';
    await connection.query(sql, [mail], function (error, result, field) {
        console.log('count > ' + result.length);
        if (result.length !== 0) {
            console.log('test2_1 > ' + test);
            test = 'test2';
            console.log('test2_2 > ' + test);

            session.error_mail = '既に登録されているメールアドレスです';
            console.log(session);
            // ctx.body = session;

            ctx.redirect('/signup');
        } else {
            let sql = 'INSERT INTO user (user_name, mail, password) VALUES (?, ?, ?)';
            connection.query(sql, [userName, mail, bcrypt.hashSync(password, 10)], function (error, result, field) {
                console.log('登録')
            })
        }
    });

    console.log('test3_1 > ' + test);
    test = 'test3';
    console.log('test3_2 > ' + test);

    ctx.redirect('/signup')
})

module.exports = router;
