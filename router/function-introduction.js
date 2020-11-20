const Router = require('koa-router');
const router = new Router();
const app = require('../app/app');

router.get('/function-introduction', async (ctx) => {
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
    result['data']['meta']['site_title'] = 'イントロダクション - Medice Note';
    result['data']['meta']['group_list'] = await app.getGroupList(userId);

    if (session.error !== undefined) {
        result['data']['error'] = session.error;
        session.error = undefined;
    }

    await ctx.render('function-introduction', result);
})

module.exports = router;
