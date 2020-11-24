const Router = require('koa-router');
const router = new Router();
const connection = require('../app/db');
const app = require('../app/app');
const {v4: uuid} = require('uuid');

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

    return await ctx.render('two-factor-authentication-setting', result);
});

module.exports = router;
