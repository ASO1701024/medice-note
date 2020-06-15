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
    if (!session.auth_id) {
        return ctx.redirect('/login');
    }
    let result = {data: {}};

    if (typeof session.error_update_user_name !== 'undefined') {
        result.data['errorMsg'] = {};
        result.data['errorMsg']['userName'] = session.error_update_user_name;
        session.error_update_user_name = undefined;
    }
    if (typeof session.error_update_mail !== 'undefined') {
        result.data['errorMsg'] = {};
        result.data['errorMsg']['mail'] = session.error_update_mail;
        session.error_update_mail = undefined;
    }
    if (typeof session.error_update_password !== 'undefined') {
        result.data['errorMsg'] = {};
        result.data['errorMsg']['password'] = session.error_update_password;
        session.error_update_password = undefined;
    }

    // ユーザーの情報を取得してrenderに渡す
    let userId = await app.getUserId(session.auth_id);
    let sql = 'SELECT user_name as userName, mail FROM user WHERE user_id = ? ';
    let userData = (await connection.query(sql, [userId]))[0][0];
    result.data['request'] = {userName: userData['userName'], mail: userData['mail']}

    await ctx.render('/account-update', result);
})

router.post('/account-update/:updateFlg', async (ctx) => {
    let session = ctx.session;
    let updateFlg = ctx.params['updateFlg'];
    if (!session.auth_id) {
        return ctx.redirect('/login');
    }
    let userId = await app.getUserId(session.auth_id);
    let sql = "";
    let args = [];
    let is_success = false;
    switch (updateFlg) {
        // userNameを編集する場合
        case 'userName': {
            let newUserName = ctx.request.body['userName'];
            let userNameValidate = new validator({
                userName: newUserName
            }, {
                userName: 'required|string|min:1|max:20'
            }, {
                required: "ユーザー名は1文字以上20字以下で入力して下さい",
                string: "ユーザー名は入力欄に入力して下さい",
                min: "ユーザー名は1文字以上20字以下で入力して下さい",
                max: "ユーザー名は1文字以上20字以下で入力して下さい",
            });
            await userNameValidate.checkAsync(() => {
                is_success = true;
            }, () => {
                session.error_update_user_name = userNameValidate.errors.first('userName');
                is_success = false;
            });
            if (is_success) {
                sql = 'UPDATE user SET user_name = ? WHERE user_id = ?;'
                args = [newUserName, userId];
            }
            break;
        }
        // mailを編集する場合
        case 'mail': {
            let newMail = ctx.request.body['mail'];

            // validation
            let mailValidate = new validator({
                mail: newMail,
            }, {
                mail: 'required|email|max:100'
            }, {
                required: "メールアドレスは正しい形式で入力して下さい",
                email: "メールアドレスは正しい形式で入力して下さい",
                max: "メールアドレスは100字以下のアドレスをご指定下さい",
            });
            await mailValidate.checkAsync(() => {
                is_success = true;
            }, () => {
                session.error_update_mail = mailValidate.errors.first('mail');
                is_success = false;
            });

            if (is_success) {
                // 重複確認
                let mailDoubleCheckSQL = 'SELECT user_id FROM user WHERE mail = ?;';
                let mailCheckResult = (await connection.query(mailDoubleCheckSQL, [newMail]))[0];
                if (mailCheckResult.length !== 0) {
                    is_success = false;
                    if (mailCheckResult[0]['user_id'] !== userId) {
                        session.error_update_mail = "既に登録されているメールアドレスです";
                        return ctx.redirect('/account-update');
                    }
                    break;
                } else {
                    sql = 'UPDATE user SET mail = ? WHERE user_id = ?;';
                    args = [newMail, userId];
                }
            }
            break;
        }
        // passwordを変更する場合
        case 'password': {
            let newPassword = ctx.request.body['password'];
            let passwordValidate = new validator({
                password: newPassword
            }, {
                password: 'required|string|min:5|max:100'
            }, {
                'required': "5文字以上のパスワードを設定して下さい",
                'string': "パスワードは入力欄に入力して下さい",
                'min': "5文字以上のパスワードを設定して下さい",
                'max': "パスワードは100文字以下で設定して下さい",
            });
            await passwordValidate.checkAsync(() => {
                is_success = true;
            }, () => {
                session.error_update_password = passwordValidate.errors.first('password');
                is_success = false;
            });
            if (is_success) {
                let getPasswordSQL = 'SELECT password FROM user WHERE user_id = ?;';
                let passwordResult = (await connection.query(getPasswordSQL, [userId]))[0][0]['password'];
                if (bcrypt.compareSync(newPassword, passwordResult)) {
                    is_success = false;
                    session.error_update_password = "現在とは異なるパスワードを設定して下さい";
                    return ctx.redirect('/account-update');
                } else {
                    sql = 'UPDATE user SET password = ? WHERE user_id = ?;';
                    args = [bcrypt.hashSync(newPassword, 10), userId];
                }
            }
            break;
        }
    }

    // 更新項目の検証成功時、更新処理を行う。
    if (is_success) {
        await connection.query(sql, args);
    }
    return ctx.redirect('/account-update');
})

module.exports = router;
