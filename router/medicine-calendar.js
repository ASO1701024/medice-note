const Router = require('koa-router');
const router = new Router();
const app = require('../app/app');

router.get('/medicine-calendar', async (ctx) => {
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
    result['data']['meta']['site_title'] = 'お薬カレンダー - Medice Note';
    result['data']['meta']['group_list'] = await app.getGroupList(userId);
    result['data']['meta']['css'] = [
        '/stisla/modules/fullcalendar/fullcalendar.min.css'
    ];
    result['data']['meta']['script'] = [
        '/stisla/modules/fullcalendar/fullcalendar.min.js',
        '/stisla/modules/fullcalendar/locale/ja.js',
        '/js/medicine-calendar.js'
    ];

    if (session.error !== undefined) {
        result['data']['error'] = session.error;
        session.error = undefined;
    }

    if (session.success !== undefined) {
        result['data']['success'] = session.success;
        session.success = undefined;
    }

    await ctx.render('medicine-calendar', result);
})

module.exports = router;