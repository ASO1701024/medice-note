const Router = require('koa-router');
const router = new Router();
const connection = require('../app/db');
const app = require('../app/app');
const parser = require('ua-parser-js');

router.get('/two-factor-authentication-setting', async (ctx) => {
    let session = ctx.session;
    app.initializeSession(session);

    let authId = session.auth_id;
    let userId = await app.getUserId(authId);
    if (!userId) {
        session.error.message = 'ログインしていないため続行できませんでした';

        return ctx.redirect('/login');
    }

    let result = app.initializeRenderResult();
    result['data']['meta']['login_status'] = true;
    result['data']['meta']['site_title'] = '二段階認証設定 - Medice Note';
    result['data']['meta']['group_list'] = await app.getGroupList(userId);

    let sql = 'SELECT pc_uuid, env_ua, env_ip, validity_flag, timestamp FROM user_login_pc WHERE user_id = ?';
    let [data] = await connection.query(sql, [userId]);
    console.log(data);

    for (const key in data) {
        if (data.hasOwnProperty(key)) {
            console.log(parser(data[key]['env_ua']))
        }
    }

    // if (ua.browser.name === undefined || !['chrome', 'firefox'].includes(ua.browser.name.toLowerCase())) {
    //     result['data']['meta']['browser_warning'] = true;
    // }

    await ctx.render('two-factor-authentication-setting', result);
});

module.exports = router;
