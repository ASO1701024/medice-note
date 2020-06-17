const Router = require('koa-router');
const router = new Router();
const app = require('../app/app');
const bcrypt = require('bcrypt');
const connection = require('../app/db');
const validator = require('validatorjs');

/* session
    session.error_update_user_name
    session.error_update_mail
    session.error_update_password
*/

router.get('/account-update', async (ctx) => {
    let session = ctx.session;

    let userId = await app.getUserId(session.auth_id);
    if (userId === false) {
        return ctx.redirect('/')
    }

    let result = {data: {errorMsg: {}}};

    if (typeof session.error_update_user_name !== 'undefined') {
        result.data['errorMsg']['userName'] = session.error_update_user_name;
        session.error_update_user_name = undefined;
    }
    if (typeof session.error_update_mail !== 'undefined') {
        result.data['errorMsg']['mail'] = session.error_update_mail;
        session.error_update_mail = undefined;
    }
    if (typeof session.error_update_password !== 'undefined') {
        result.data['errorMsg']['password'] = session.error_update_password;
        session.error_update_password = undefined;
    }

    // ユーザーの情報を取得してrenderに渡す
    let sql = 'SELECT user_name as userName, mail FROM user WHERE user_id = ? ';
    let userData = (await connection.query(sql, [userId]))[0][0];
    result.data['request'] = {userName: userData['userName'], mail: userData['mail']};

    await ctx.render('/account-update', result);
})

router.post('/account-update', async (ctx) => {
    let session = ctx.session;

    let userId = await app.getUserId(session.auth_id);
    if (userId === false) {
        return ctx.redirect('/')
    }

    let userNameIsSuccess = true;
    let mailIsSuccess = true;
    let passwordIsSuccess = true;

    // userNameの値の検証
    let newUserName = ctx.request.body['userName'];
    let userNameValidate = new validator({
        userName: newUserName,
    }, {
        userName: 'required|string|min:1|max:20',
    }, {
        required: "ユーザー名は1文字以上20字以下で入力して下さい",
        string: "ユーザー名は入力欄に入力して下さい",
        min: "ユーザー名は1文字以上20字以下で入力して下さい",
        max: "ユーザー名は1文字以上20字以下で入力して下さい",
    });
    await userNameValidate.checkAsync(() => {
        userNameIsSuccess = true;
    }, () => {
        session.error_update_user_name = userNameValidate.errors.first('userName');
        userNameIsSuccess = false;
    });

    // mailの値の検証
    let newMail = ctx.request.body['mail'];
    let mailValidate = new validator({
        mail: newMail,
    }, {
        mail: 'required|email|max:100',
    }, {
        required: "メールアドレスは正しい形式で入力して下さい",
        email: "メールアドレスは正しい形式で入力して下さい",
        max: "メールアドレスは100字以下のアドレスをご指定下さい",
    });
    await mailValidate.checkAsync(() => {
        mailIsSuccess = true;
    }, () => {
        session.error_update_mail = mailValidate.errors.first('mail');
        mailIsSuccess = false;
    });
    if (mailIsSuccess) {
        // 重複確認
        let mailDoubleCheckSQL = 'SELECT user_id FROM user WHERE mail = ?;';
        let mailCheckResult = (await connection.query(mailDoubleCheckSQL, [newMail, userId]))[0];
        if (mailCheckResult.length !== 0) {
            if (mailCheckResult[0]['user_id'] !== userId) {
                mailIsSuccess = false;
                session.error_update_mail = "既に登録されているメールアドレスです";
            }
        }
    }

    // passwordの値の検証
    let newPassword = ctx.request.body['password'];
    if (newPassword !== "") {
        let passwordValidate = new validator({
            password: newPassword,
        }, {
            password: 'string|min:5|max:100'
        }, {
            'required': "5文字以上のパスワードを設定して下さい",
            'string': "パスワードは入力欄に入力して下さい",
            'min': "5文字以上のパスワードを設定して下さい",
            'max': "パスワードは100文字以下で設定して下さい",
        });
        await passwordValidate.checkAsync(() => {
            passwordIsSuccess = true;
        }, () => {
            session.error_update_password = passwordValidate.errors.first('password');
            passwordIsSuccess = false;
        });
        if (passwordIsSuccess) {
            let getPasswordSQL = 'SELECT password FROM user WHERE user_id = ?;';
            let passwordResult = (await connection.query(getPasswordSQL, [userId]))[0][0]['password'];
            if (bcrypt.compareSync(newPassword, passwordResult)) {
                passwordIsSuccess = false;
                session.error_update_password = "現在とは異なるパスワードを設定して下さい";
            }
        }
    }
    // 更新項目の検証成功時、更新処理を行う。
    if (userNameIsSuccess && mailIsSuccess && passwordIsSuccess) {
        let queryPromise = [];
        let userNameSQL = 'UPDATE user SET user_name = ? WHERE user_id = ?;';
        let userNameArgs = [newUserName, userId];
        queryPromise[0] = connection.query(userNameSQL, userNameArgs);
        let mailSQL = 'UPDATE user SET mail = ? WHERE user_id = ?;';
        let mailArgs = [newMail, userId];
        queryPromise[1] = connection.query(mailSQL, mailArgs);
        let passwordSQL = 'UPDATE user SET password = ? WHERE user_id = ?;';
        let passwordArgs = [bcrypt.hashSync(newPassword, 10), userId];
        queryPromise[2] = connection.query(passwordSQL, passwordArgs);
        await Promise.all(queryPromise);
    }
    return ctx.redirect('/account-update');
})

module.exports = router;
