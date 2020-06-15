const Router = require('koa-router');
const router = new Router();
const app = require('../app/app');
const connection = require('../app/db');

router.get('/account-setting', async (ctx, next) => {
    let session = ctx.session;

    let authId = session.auth_id;
    if (!authId || !await app.getUserId(session.auth_id)) {
        return ctx.redirect('/login');
    }

    let userId = await app.getUserId(authId);

    let result = {};
    result['data'] = {};
    result['meta'] = {};
    result['meta']['login_status'] = Boolean(userId);

    let sql = 'SELECT user_name, mail FROM user WHERE user_id = ?';
    let [user] = await connection.query(sql, [userId]);
    result['data']['account'] = {};
    result['data']['account']['user_name'] = user[0]['user_name'];
    result['data']['account']['mail'] = user[0]['mail'];

    await ctx.render('account-setting', result);
})

module.exports = router;