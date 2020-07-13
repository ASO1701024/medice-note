const Router = require('koa-router');
const router = new Router();
const app = require('../app/app');
const parser = require('ua-parser-js');

router.get('/', async (ctx) => {
    let session = ctx.session;
    app.initializeSession(session);

    let result = app.initializeRenderResult();

    let authId = session.auth_id;
    let userId = await app.getUserId(authId);
    result['data']['meta']['login_status'] = Boolean(userId);
    result['data']['meta']['site_title'] = 'トップページ - Medice Note';

    let ua = parser(ctx.request.header['user-agent']);
    if (!['chrome', 'firefox'].includes(ua.browser.name.toLowerCase())) {
        result['data']['meta']['browser_warning'] = true;
    }

    if (Boolean(userId)) {
        result['data']['meta']['group_list'] = await app.getGroupList(userId);
    }

    if (session.success !== undefined) {
        result['data']['success'] = session.success;
        session.success = undefined;
    }

    if (session.error !== undefined) {
        result['data']['error'] = session.error;
        session.error = undefined;
    }

    await ctx.render('index', result);
})

module.exports = router;
