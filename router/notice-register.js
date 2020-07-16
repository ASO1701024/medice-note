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
        session.error.message = 'ログインしていないため続行できませんでした';

        return ctx.redirect('/login');
    }

    let result = app.initializeRenderResult();
    result['data']['meta']['login_status'] = true;
    result['data']['meta']['site_title'] = '通知登録 - Medice Note';
    result['data']['meta']['group_list'] = await app.getGroupList(userId);
    result['data']['meta']['css'] = [
        '/stisla/modules/select2/dist/css/select2.min.css',
        '/stisla/modules/bootstrap-daterangepicker/daterangepicker.css'
    ];
    result['data']['meta']['script'] = [
        '/stisla/modules/select2/dist/js/select2.full.min.js',
        '/stisla/modules/bootstrap-daterangepicker/daterangepicker.js',
        '/js/library/handlebars.min.js',
        '/js/notice-register.js'
    ];

    let sql = 'SELECT medicine_id, medicine_name FROM medicine  ' +
        'WHERE group_id in (SELECT group_id FROM medicine_group WHERE user_id = ?)'

    let [medicineList] = await connection.query(sql, [userId]);
    result['data']['medicine_list'] = medicineList;

    if (session.success !== undefined) {
        result['data']['success'] = session.success;
        session.success = undefined;
    }

    if (session.error !== undefined) {
        result['data']['error'] = session.error;
        session.error = undefined;
    }

    if (session.old !== undefined) {
        result['data']['old'] = session.old;
        session.old = undefined;
    }

    await ctx.render('notice-register', result);
})

router.post('/notice-register', async (ctx) => {
    let session = ctx.session;
    app.initializeSession(session);

    let authId = session.auth_id;
    let userId = await app.getUserId(authId);
    if (!userId) {
        session.error.message = 'ログインしていないため続行できませんでした';

        return ctx.redirect('/login');
    }

    let noticeName = ctx.request.body['notice_name'];
    let medicineId = ctx.request.body['medicine_id'];
    let noticeTime = ctx.request.body['notice_time'];
    let noticeDay = ctx.request.body['notice_day'];
    let endDate = ctx.request.body['end_date'];

    if (typeof medicineId === "string") {
        medicineId = [medicineId];
    }
    if (typeof noticeTime === "string") {
        noticeTime = [noticeTime];
    }
    if (typeof noticeDay === "string") {
        noticeDay = [noticeDay];
    }

    medicineId = Array.from(new Set(medicineId));
    noticeTime = Array.from(new Set(noticeTime));
    noticeDay = Array.from(new Set(noticeDay));

    let validationNoticeName = app.validationNoticeName(noticeName);
    let validationNoticeMedicineId = await app.validationNoticeMedicineId(medicineId, userId);
    let validationNoticeTime = app.validationNoticeTime(noticeTime);
    let validationNoticeDay = app.validationNoticeDay(noticeDay);
    let validationEndDate = app.validationEndDate(endDate);

    if (validationNoticeName && validationNoticeMedicineId && validationNoticeTime && validationNoticeDay && validationEndDate) {
        let sql = 'INSERT INTO notice (notice_name, notice_period, user_id) VALUES (?, ?, ?)';
        let [notice] = await connection.query(sql, [noticeName, endDate, userId]);

        let noticeId = notice.insertId;

        for (let i = 0; i < medicineId.length; i++) {
            let sql = 'INSERT INTO notice_medicine (notice_id, medicine_id) VALUES (?, ?)';
            await connection.query(sql, [noticeId, medicineId[i]]);
        }

        for (let i = 0; i < noticeDay.length; i++) {
            let sql = 'INSERT INTO notice_day (notice_id, day_of_week) VALUES (?, ?)';
            await connection.query(sql, [noticeId, noticeDay[i]]);
        }

        for (let i = 0; i < noticeTime.length; i++) {
            let sql = 'INSERT INTO notice_time (notice_id, notice_time) VALUES (?, ?)';
            await connection.query(sql, [noticeId, noticeTime[i]]);
        }

        return ctx.redirect('/notice-list');
    } else {
        session.error.message = '通知情報登録に失敗しました';

        if (noticeName !== '') session.old.notice_name = noticeName;
        if (medicineId.length > 0) {
            let medicineList = [];
            for (let i = 0; i < medicineId.length; i++) {
                if (await app.isHaveMedicine(medicineId[i], userId)) {
                    let sql = 'SELECT medicine_id, medicine_name, number FROM medicine WHERE medicine_id = ?';
                    let [medicine] = await connection.query(sql, [medicineId[i]]);
                    medicineList.push(medicine[0]);
                }
            }
            session.old.medicine_id = medicineList;
        }
        if (noticeTime.length > 0) session.old.notice_time = noticeTime;
        if (noticeDay.length > 0) session.old.notice_day = noticeDay;
        if (endDate) session.old.end_date = endDate;

        if (!validationNoticeName) session.error.notice_name = '100文字以内で入力してください';
        if (!validationNoticeMedicineId) session.error.medicine_id = '薬情報が正しく選択されていません';
        if (!validationNoticeTime) session.error.notice_time = '通知時間が正しく選択されていません';
        if (!validationNoticeDay) session.error.notice_day = '通知曜日が正しく選択されていません';
        if (!validationEndDate) session.error.end_date = '日付の書式で入力してください';

        return ctx.redirect('/notice-register');
    }
})

module.exports = router;
