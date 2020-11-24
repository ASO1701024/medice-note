const Router = require('koa-router');
const router = new Router();
const app = require('../app/app');

router.get('/introduction', async (ctx) => {
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
    result['data']['meta']['site_title'] = '使い方 - Medice Note';
    result['data']['meta']['group_list'] = await app.getGroupList(userId);

    await ctx.render('introduction', result);
})

module.exports = router;
