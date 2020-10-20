const Router = require('koa-router');
const router = new Router();
const app = require('../app/app');
const connection = require('../app/db');

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
    result['data']['meta']['css'] = [
        '/stisla/modules/select2/dist/css/select2.min.css',
        '/stisla/modules/bootstrap-daterangepicker/daterangepicker.css',
        '/css/library/jquery-ui.min.css',
        '/css/library/notyf.min.css'
    ];
    result['data']['meta']['script'] = [
        '/stisla/modules/select2/dist/js/select2.full.min.js',
        '/stisla/modules/bootstrap-daterangepicker/daterangepicker.js',
        '/stisla/modules/sweetalert/sweetalert.min.js',
        '/js/library/jquery-ui.min.js',
        '/js/library/notyf.min.js',
        '/js/library/handlebars.min.js',
        '/js/medicine-bulk-register.js',
    ];

    let sql = 'SELECT type_id, type_name FROM medicine_type';
    let [medicineType] = await connection.query(sql);
    result['data']['meta']['medicine_type'] = medicineType;

    sql = 'SELECT take_time_id, take_time_name FROM take_time';
    let [takeTime] = await connection.query(sql);
    result['data']['meta']['take_time'] = takeTime;

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
    let session = ctx.session;
    app.initializeSession(session);

    let authId = session.auth_id;
    let userId = await app.getUserId(authId);
    if (!userId) {
        session.error.message = 'ログインしていないため続行できませんでした';

        return ctx.redirect('/login');
    }

    let referer = ctx.request.header['referer'];
    let contentType = ctx.request.header['content-type'];
    let parser = new URL(referer);
    if (parser.pathname !== '/bulk-register' || contentType !== 'application/json') {
        return ctx.body = {
            'status': false,
            'error': '不明なリクエストが発生しました'
        };
    }

    let json = ctx.request.body;
    console.log(json);

    let hospitalName = json['hospital_name'];
    let startsDate = json['starts_date'];
    let groupId = json['group_id'];

    let items = json['item'];
    console.log(items);
    for (let i = 0; i < items.length; i++) {
        console.log(items[i]);
    }
})

module.exports = router;
