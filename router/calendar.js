const Router = require('koa-router');
const router = new Router();
const app = require('../app/app');
const connection = require('../app/db');

router.get('/calendar', async (ctx) => {
    let session = ctx.session;
    app.initializeSession(session);

    // Login Check
    let authKey = session.auth_id;
    let userId = await app.getUserId(authKey);
    if (!userId) {
        session.error.message = 'ログインしていないため続行できませんでした';

        return ctx.redirect('/login');
    }
    let result = app.initializeRenderResult();
    result['data']['meta']['login_status'] = true;
    result['data']['meta']['site_title'] = 'カレンダー - Medice Note';

    if (session.error !== undefined) {
        result['data']['error'] = session.error;
        session.error = undefined;
    }

    if (session.success !== undefined) {
        result['data']['success'] = session.success;
        session.success = undefined;
    }

    if (session.old !== undefined) {
        result['data']['old'] = session.old;
        session.old = undefined;
    }

    await ctx.render('/calendar', result);

})

module.exports = router;