const Router = require('koa-router');
const router = new Router();
const connection = require('../db');
const bcrypt = require('bcrypt');

router.get('/login', async (ctx, next) => {
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

    await ctx.render('login', result);
})

router.post('/login', async (ctx, next) => {
    let session = ctx.session;

    let mail = ctx.request.body.mail;
    let password = ctx.request.body.password;

    let sql = 'SELECT user_id, password, is_enable FROM user WHERE mail = ? AND deleted_at IS NULL';
    let [user] = await connection.query(sql, [mail]);
    if (user.length === 0) {
        session.error_message = 'アカウントが見つかりませんでした';
    } else {
        for (let i = 0; i < 1; i++) {
            if (user[i].is_enable === false) {
                session.error_message = 'メールアドレスが認証されていません';
            } else {
                let hashPassword = user[i].password;
                if (bcrypt.compareSync(password, hashPassword)) {
                    session.success_message = 'ログインしました';
                } else {
                    session.error_message = 'ログインに失敗しました';
                }
            }
        }
    }

    ctx.redirect('/login')
})

module.exports = router;
