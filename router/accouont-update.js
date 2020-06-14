const Router = require('koa-router');
const router = new Router();
const app = require('../app/app');
const connection = require('../app/db');
const validator = require('validatorjs');

router.get('/account-update', async (ctx) => {
    let session = ctx.session;
    if (!session.auth_id) {
        return ctx.redirect('/login');
    }
    let result = {data: {}};

    if (typeof session.error_update_user_name !== 'undefined') {
        result.data['errorMsg'] = {};
        result.data['errorMsg']['userName'] = session.error_update_user_name;
        session.error_update_user_name = null;
    }
    if (typeof session.error_update_mail !== 'undefined') {
        result.data['errorMsg'] = {};
        result.data['errorMsg']['mail'] = session.error_update_mail;
        session.error_update_mail = null;
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

    let sql = "";
    let arg = null;
    let is_success = false;
    switch (updateFlg) {
        // userNameを編集する場合
        case 'userName': {
            let userNameValidate = new validator({
                userName: ctx.request.body['userName']
            }, {
                userName: 'required|string|min:1|max:20'
            }, {
                required: "ユーザー名は1文字以上20字以下で入力して下さい",
                string: "ユーザー名は入力欄に入力して下さい",
                min: "ユーザー名は1文字以上20字以下で入力して下さい",
                max: "ユーザー名は1文字以上20字以下で入力して下さい",
            });
            await userNameValidate.checkAsync(() => {
                sql = 'UPDATE user SET user_name = ? WHERE user_id = ?;'
                arg = ctx.request.body['userName'];
                is_success = true;
            }, () => {
                console.log(21)
                session.error_update_user_name = userNameValidate.errors.first('userName');
                is_success = false;
            })
            break;
        }
        // mailを編集する場合
        case 'mail': {
            let mailValidate = new validator({
                mail: ctx.request.body['mail']
            }, {
                mail: 'required|email|max:100'
            }, {
                required: "メールアドレスは正しい形式で入力して下さい",
                email: "メールアドレスは正しい形式で入力して下さい",
                max: "メールアドレスは100字以下のアドレスをご指定下さい",
            });
            await mailValidate.checkAsync(() => {
                sql = 'UPDATE user SET mail = ? WHERE user_id = ?;'
                arg = [ctx.request.body['mail']];
                is_success = true;
            }, () => {
                session.error_update_mail = mailValidate.errors.first('mail');
                is_success = false;
            })
            break;
        }
    }

    // 更新項目のvalidate成功時、更新処理を行う。
    if (is_success) {
        let userId = await app.getUserId(session.auth_id);
        await connection.query(sql, [arg, userId]);
    }

    return ctx.redirect('/account-update');
})

module.exports = router;
