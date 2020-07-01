const Router = require('koa-router');
const router = new Router();
const app = require('../app/app');
const connection = require('../app/db');

router.get('/account-setting', async (ctx, next) => {
    let session = ctx.session;
    app.initializeSession(session);

    let authId = session.auth_id;
    let userId = await app.getUserId(authId);
    if (!authId || !userId) {
        return ctx.redirect('/');
    }

    let result = app.initializeRenderResult();
    result['data']['meta']['login_status'] = true;
    result['data']['meta']['site_title'] = 'アカウント設定 - Medice Note';

    let sql = 'SELECT user_name, mail FROM user WHERE user_id = ?';
    let [user] = await connection.query(sql, [userId]);
    result['data']['account'] = {};
    result['data']['account']['user_name'] = user[0]['user_name'];
    result['data']['account']['mail'] = user[0]['mail'];

    let lineLoginSQL = 'SELECT line_user_name FROM line_login WHERE user_id = ?;';
    let lineUserName = await connection.query(lineLoginSQL, [userId])[0];
    if(lineUserName.length > 0){
        result['data']['account']['line_user_name'] = lineUserName[0]['line_user_name'];
    }

    await ctx.render('account-setting', result);
})

module.exports = router;