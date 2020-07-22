const Router = require('koa-router');
const router = new Router();
const app = require('../app/app');

router.get('/', async (ctx) => {
    let session = ctx.session;
    app.initializeSession(session);

    let result = app.initializeRenderResult();

    let authId = session.auth_id;
    let userId = await app.getUserId(authId);
    result['data']['meta']['login_status'] = Boolean(userId);
    result['data']['meta']['site_title'] = 'トップページ - Medice Note';
    result['data']['meta']['seo']['bool'] = true;
    result['data']['meta']['seo']['description'] = 'お薬手帳をウェブサイトで管理できるサービスです';
    result['data']['meta']['seo']['url'] = 'https://www.medice-note.vxx0.com';

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
