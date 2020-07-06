const Router = require('koa-router');
const router = new Router();
const app = require('../app/app');
const connection = require('../app/db');

router.get('/notice-register', async (ctx) => {
    let session = ctx.session;
    app.initializeSession(session);

    let authId = session.auth_id;
    let userId = await app.getUserId(authId);
    if (!userId) {
        session.error = 'ログインしていないため続行できませんでした';

        return ctx.redirect('/login');
    }

    let result = app.initializeRenderResult();
    result['data']['meta']['login_status'] = true;
    result['data']['meta']['site_title'] = '通知登録 - Medice Note';
    result['data']['meta']['group_list'] = await app.getGroupList(userId);
    result['data']['meta']['css'] = [
        '/stisla/modules/select2/dist/css/select2.min.css',
        '/stisla/modules/bootstrap-timepicker/css/bootstrap-timepicker.min.css'
    ];
    result['data']['meta']['script'] = [
        '/stisla/modules/select2/dist/js/select2.full.min.js',
        '/stisla/modules/bootstrap-timepicker/js/bootstrap-timepicker.min.js',
        '/js/library/handlebars.min.js',
        '/js/notice-register.js',
        '/js/app.js'
    ];

    let sql = 'SELECT medicine_id, medicine_name FROM medicine  ' +
        'WHERE group_id in (SELECT group_id FROM medicine_group WHERE user_id = ?)'

    let [medicineList] = await connection.query(sql, [userId]);
    result['data']['medicine_list'] = medicineList;

    if (session.success !== undefined) {
        result['data']['success'] = session.success;
        session.success.message = undefined;
    }

    if (session.error !== undefined) {
        result['data']['error'] = session.error;
        session.error = undefined;
    }

    await ctx.render('notice-register', result);
})

module.exports = router;
