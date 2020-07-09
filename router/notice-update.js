const Router = require('koa-router');
const router = new Router();
const app = require('../app/app');
const connection = require('../app/db');

router.get('/notice-update/:notice_id', async (ctx) => {
    let session = ctx.session;
    app.initializeSession(session);

    let authId = session.auth_id;
    let userId = await app.getUserId(authId);
    if (!userId) {
        session.error.message = 'ログインしていないため続行できませんでした';

        return ctx.redirect('/login');
    }

    let noticeId = ctx.params['notice_id'];
    let sql = 'SELECT notice_id FROM notice WHERE notice_id = ? AND user_id = ?';
    let [count] = await connection.query(sql,[noticeId, userId]);
    if (count.length === 0) {
        session.error.message = '通知情報が見つかりませんでした';

        return ctx.redirect('/notice-list');
    }

    let result = app.initializeRenderResult();
    result['data']['meta']['login_status'] = true;
    result['data']['meta']['site_title'] = '通知編集 - Medice Note';
    result['data']['meta']['group_list'] = await app.getGroupList(userId);
    result['data']['meta']['css'] = [
        '/stisla/modules/select2/dist/css/select2.min.css',
        '/stisla/modules/bootstrap-daterangepicker/daterangepicker.css'
    ];
    result['data']['meta']['script'] = [
        '/stisla/modules/select2/dist/js/select2.full.min.js',
        '/stisla/modules/bootstrap-daterangepicker/daterangepicker.js',
        '/js/library/handlebars.min.js',
        '/js/notice-register.js',
        '/js/app.js'
    ];

    sql = 'SELECT notice_name, date_format(notice_period, \'%Y-%c-%d\') as end_date FROM notice WHERE notice_id = ?';
    let [notice] = await connection.query(sql, [noticeId]);
    notice = notice[0];

    notice['notice_id'] = noticeId;
    sql = 'SELECT m.medicine_id, m.medicine_name, m.number FROM notice_medicine AS nm ' +
        'LEFT JOIN medicine AS m ON nm.medicine_id = m.medicine_id ' +
        'WHERE notice_id = ?';
    let [medicine] = await connection.query(sql, [noticeId]);
    notice['medicine_id'] = [];
    medicine.forEach(d => {
        notice['medicine_id'].push(d);
    })

    sql = 'SELECT time_format(notice_time, \'%H:%i\') as notice_time FROM notice_time WHERE notice_id = ?';
    let [time] = await connection.query(sql, [noticeId]);
    notice['notice_time'] = [];
    time.forEach(d => {
        notice['notice_time'].push(d['notice_time']);
    })

    sql = 'SELECT day_of_week FROM notice_day WHERE notice_id = ?';
    let [week] = await connection.query(sql, [noticeId]);
    notice['notice_day'] = [];
    week.forEach(d => {
        notice['notice_day'].push(d['day_of_week']);
    })
    result['data']['old'] = notice;

    sql = 'SELECT medicine_id, medicine_name FROM medicine  ' +
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

    if (session.old !== undefined && Object.keys(session.old).length !== 0) {
        result['data']['old'] = session.old;
        session.old = undefined;
    }

    await ctx.render('notice-update', result);
})

router.post('/notice-update/:notice_id', async (ctx) => {
    let session = ctx.session;
    app.initializeSession(session);

    let authId = session.auth_id;
    let userId = await app.getUserId(authId);
    if (!userId) {
        return ctx.redirect('/login');
    }

    let noticeId = ctx.params['notice_id'];
    let sql = 'SELECT notice_id FROM notice WHERE notice_id = ? AND user_id = ?';
    let [count] = await connection.query(sql,[noticeId, userId]);
    if (count.length === 0) {
        session.error.message = '通知情報が見つかりませんでした';

        return ctx.redirect('/notice-list');
    }

    let noticeName = ctx.request.body['notice_name'];
    let medicineId = ctx.request.body['medicine_id'];
    let noticeTime = ctx.request.body['notice_time'];
    let noticeDay = ctx.request.body['notice_day'];
    let endDate = ctx.request.body['end_date'];

    medicineId = Array.from(new Set(medicineId));
    noticeTime = Array.from(new Set(noticeTime));
    noticeDay = Array.from(new Set(noticeDay));

    let validationNoticeName = app.validationNoticeName(noticeName);
    let validationNoticeMedicineId = await app.validationNoticeMedicineId(medicineId, userId);
    let validationNoticeTime = app.validationNoticeTime(noticeTime);
    let validationNoticeDay = app.validationNoticeDay(noticeDay);
    let validationEndDate = app.validationEndDate(endDate);

    if (validationNoticeName && validationNoticeMedicineId && validationNoticeTime && validationNoticeDay && validationEndDate) {
        let sql = 'UPDATE notice SET notice_name = ?, notice_period = ? WHERE notice_id';
        await connection.query(sql, [noticeName, endDate, userId]);

        sql = 'DELETE FROM notice_medicine WHERE notice_id = ?';
        await connection.query(sql, [noticeId]);
        for (let i = 0; i < medicineId.length; i++) {
            sql = 'INSERT INTO notice_medicine (notice_id, medicine_id) VALUES (?, ?)';
            await connection.query(sql, [noticeId, medicineId[i]]);
        }

        sql = 'DELETE FROM notice_day WHERE notice_id = ?';
        await connection.query(sql, [noticeId]);
        for (let i = 0; i < noticeDay.length; i++) {
            sql = 'INSERT INTO notice_day (notice_id, day_of_week) VALUES (?, ?)';
            await connection.query(sql, [noticeId, noticeDay[i]]);
        }

        sql = 'DELETE FROM notice_time WHERE notice_id = ?';
        await connection.query(sql, [noticeId]);
        for (let i = 0; i < noticeTime.length; i++) {
            sql = 'INSERT INTO notice_time (notice_id, notice_time) VALUES (?, ?)';
            await connection.query(sql, [noticeId, noticeTime[i]]);
        }

        session.success.message = '通知情報を変更しました';

        return ctx.redirect('/notice-list');
    } else {
        session.error.message = '通知情報編集に失敗しました';

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

        return ctx.redirect(`/notice-update/${noticeId}`);
    }
})

module.exports = router;
