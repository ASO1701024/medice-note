const Router = require('koa-router');
const router = new Router();
const app = require('../app/app');
const connection = require('../app/db');
const bcrypt = require('bcrypt');

router.get('/bulk-register', async (ctx) => {
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
    result['data']['meta']['site_title'] = '薬情報一括登録 - Medice Note';
    result['data']['meta']['group_list'] = await app.getGroupList(userId);

    if (session.error !== undefined) {
        result['data']['error'] = session.error;
        session.error = undefined;
    }
    if (session.success !== undefined) {
        result['data']['success'] = session.success;
        session.success = undefined;
    }

    await ctx.render('bulk-register', result);
})

router.post('/bulk-register', async (ctx) => {

})

module.exports = router;
