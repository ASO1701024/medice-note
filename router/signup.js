const Router = require('koa-router');
const router = new Router();
const mysql = require('mysql');
const connection = require('../db');
const validator = require('validatorjs');
const bcrypt = require('bcrypt');

router.get('/signup', async (ctx, next) => {
    await ctx.render('signup');
})

router.post('/signup', async (ctx, next) => {
    console.log(ctx.request.body);

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

    if (userNameValidate.fails(() => { })) {
        // ユーザー名エラー
        console.log('ユーザー名')
    }

    if (mailValidate.fails(() => { })) {
        // メールエラー
        console.log('メールアドレス')
    }

    if (passwordValidate.fails(() => { })) {
        // パスワードエラー
        console.log('パスワード')
    }

    // 重複
    connection.query('SELECT user_id FROM user WHERE mail = ?', [mail], function (error, result, field) {
        if (result.length === 0) {
            // 登録可能
            console.log('可能')

            let sql = 'INSERT INTO user (user_name, mail, password) VALUES (?, ?, ?)';
            connection.query(sql, [userName, mail, bcrypt.hashSync(password, 10)], function (error, result, field) {
                console.log('登録')
            })
        } else {
            // 登録不可
            console.log('不可')
        }
    });

    ctx.redirect('/signup')
})

module.exports = router;
