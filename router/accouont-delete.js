const Router = require('koa-router');
const router = new Router();
const app = require('../app/app');
const bcrypt = require('bcrypt');
const connection = require('../app/db');

/* session
    account_delete_deny: 拒否時のエラーメッセージ
*/

router.get('/account-delete', async (ctx) => {
    let session = ctx.session;

    let userId = await app.getUserId(session.auth_id);
    if (userId === false) {
        return ctx.redirect('/')
    }

    let result = {data: {accountDelete: {}}};

    if (typeof session.account_delete_deny !== 'undefined') {
        result.data['accountDelete']['deny'] = session.account_delete_deny;
        session.account_delete_deny = undefined;
    }

    await ctx.render('/account-delete', result);
})
router.get('/account-delete/complete', async (ctx) => {
    let session = ctx.session;

    let userId = await app.getUserId(session.auth_id);
    if (userId !== false) {
        return ctx.redirect('/')
    }

    await ctx.render('/account-delete-complete');
})
router.post('/account-delete', async (ctx) => {
    let session = ctx.session;

    let userId = await app.getUserId(session.auth_id);
    if (userId === false) {
        return ctx.redirect('/')
    }

    // passwordの値の検証
    let password = ctx.request.body['password'];
    let getHashPasswordSQL = 'SELECT password FROM user WHERE user_id = ?;';
    let hashPassword = (await connection.query(getHashPasswordSQL, [userId]))[0][0]['password'];
    if (bcrypt.compareSync(password, hashPassword)) {
        // 更新処理を行う。
        let deleteAccountSQL = 'UPDATE user SET deleted_at = ? WHERE user_id = ?;';
        let date = new Date();
        await connection.query(deleteAccountSQL, [date, userId]);
        ctx.session = null;
        return ctx.redirect('account-delete/complete');
    } else {
        session.account_delete_deny = "パスワードが異なります";
    }

    return ctx.redirect('/account-delete');
})

module.exports = router;