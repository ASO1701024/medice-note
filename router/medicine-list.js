const Router = require('koa-router');
const router = new Router();
const app = require('../app/app');
const connection = require('../app/db');

router.get('/medicine-list', async (ctx) => {
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
    result['data']['meta']['site_title'] = '薬情報一覧 - Medice Note';
    result['data']['meta']['group_list'] = await app.getGroupList(userId);
    result['data']['meta']['script'] = [
        '/stisla/modules/sweetalert/sweetalert.min.js',
        '/js/medicine-delete-alert.js'
    ];
    result['data']['meta']['script_delay'] = [
        '/js/medicine-list.js'
    ]

    let sql = `
        SELECT medicine_id, medicine_name, hospital_name, number, date_format(starts_date, '%Y年%c月%d日') as starts_date, period,
               medicine_type.type_name, image, description, group_id
        FROM medicine
        LEFT JOIN medicine_type ON medicine.type_id = medicine_type.type_id
        WHERE group_id = ?
        ORDER BY starts_date DESC`;

    let [data] = await connection.query(sql, [userId]);

    for (let i = 0; i < data.length; i++) {
        let medicineId = data[i]['medicine_id'];
        sql = `
            SELECT take_time_name FROM medicine_take_time
            LEFT JOIN take_time ON medicine_take_time.take_time_id = take_time.take_time_id
            WHERE medicine_id = ?`;
        let [takeTime] = await connection.query(sql, [medicineId]);
        let takeTimeArray = [];
        for (let j = 0; j < takeTime.length; j++) {
            takeTimeArray.push(takeTime[j]['take_time_name']);
        }
        data[i]['take_time'] = takeTimeArray.join(' ・ ');
    }

    result['data']['medicine_list'] = data;

    if (session.success !== undefined) {
        result['data']['success'] = session.success;
        session.success = undefined;
    }

    if (session.error !== undefined) {
        result['data']['error'] = session.error;
        session.error = undefined;
    }

    await ctx.render('medicine-list', result);
})

module.exports = router;
