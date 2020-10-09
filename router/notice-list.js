const Router = require('koa-router');
const router = new Router();
const app = require('../app/app');
const connection = require('../app/db');

router.get('/notice-list', async (ctx) => {
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
    result['data']['meta']['site_title'] = '通知一覧 - Medice Note';
    result['data']['meta']['group_list'] = await app.getGroupList(userId);
    result['data']['meta']['script'] = [
        '/stisla/modules/sweetalert/sweetalert.min.js',
        '/js/notice-action-alert.js',
    ];

    let sql = 'SELECT notice_id, notice_name, date_format(notice_period, \'%Y年%c月%d日\') as notice_period, is_enable FROM notice WHERE user_id = ?';
    let [notice] = await connection.query(sql, [userId]);
    for (let i = 0; i < notice.length; i++) {
        let noticeId = notice[i]['notice_id'];

        sql = `
            SELECT medicine_name, number FROM notice_medicine
            LEFT JOIN medicine ON notice_medicine.medicine_id = medicine.medicine_id
            WHERE notice_id = ?`;
        let [medicine] = await connection.query(sql, [noticeId]);
        notice[i]['medicine'] = [];
        medicine.forEach(d => {
            notice[i]['medicine'].push({
                'medicine_name': d['medicine_name'],
                'number': d['number']
            })
        })

        sql = 'SELECT time_format(notice_time, \'%H:%i\') as notice_time FROM notice_time WHERE notice_id = ?';
        let [time] = await connection.query(sql, [noticeId]);
        notice[i]['time'] = [];
        time.forEach(d => {
            notice[i]['time'].push(d['notice_time']);
        })

        sql = 'SELECT day_of_week FROM notice_day WHERE notice_id = ?';
        let [week] = await connection.query(sql, [noticeId]);
        notice[i]['week'] = [];
        week.forEach(d => {
            let list = ['日', '月', '火', '水', '木', '金', '土'];
            notice[i]['week'].push(list[d['day_of_week']]);
        })
    }

    result['data']['notice_list'] = notice;

    sql = 'SELECT user_id FROM line_login WHERE user_id = ?';
    let [lineLogin] = await connection.query(sql, [userId]);
    result['data']['meta']['line_login'] = lineLogin.length !== 0;

    if (session.success !== undefined) {
        result['data']['success'] = session.success;
        session.success = undefined;
    }

    if (session.error !== undefined) {
        result['data']['error'] = session.error;
        session.error = undefined;
    }

    await ctx.render('notice-list', result);
})

router.get('/notice-delete/:notice_id', async (ctx) => {
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
    let [notice] = await connection.query(sql, [noticeId, userId]);
    if (notice.length === 0) {
        session.error.message = '通知情報が見つかりませんでした';

        return ctx.redirect('/notice-list');
    }

    sql = 'DELETE FROM notice_medicine WHERE notice_id = ?';
    await connection.query(sql, [noticeId]);

    sql = 'DELETE FROM notice_day WHERE notice_id = ?';
    await connection.query(sql, [noticeId]);

    sql = 'DELETE FROM notice_time WHERE notice_id = ?';
    await connection.query(sql, [noticeId]);

    sql = 'DELETE FROM notice WHERE notice_id = ?';
    await connection.query(sql, [noticeId]);

    session.success.message = '通知情報を削除しました';

    ctx.redirect('/notice-list');
})

router.get('/notice-toggle/:bool/:notice_id', async (ctx) => {
    let session = ctx.session;
    app.initializeSession(session);

    let authId = session.auth_id;
    let userId = await app.getUserId(authId);
    if (!userId) {
        session.error.message = 'ログインしていないため続行できませんでした';

        return ctx.redirect('/login');
    }

    let noticeId = ctx.params['notice_id'];
    let bool = ctx.params['bool'];

    let sql = 'SELECT notice_id FROM notice WHERE notice_id = ? AND user_id = ?';
    let [notice] = await connection.query(sql, [noticeId, userId]);
    if (notice.length === 0) {
        session.error.message = '通知情報が見つかりませんでした';

        return ctx.redirect('/notice-list');
    }

    switch (bool) {
        case 'true':
            sql = 'UPDATE notice SET is_enable = ? WHERE notice_id = ?';
            await connection.query(sql, [true, noticeId]);

            session.success.message = '通知を有効化しました';
            break;
        case 'false':
            sql = 'UPDATE notice SET is_enable = ? WHERE notice_id = ?';
            await connection.query(sql, [false, noticeId]);

            session.success.message = '通知を無効化しました';
            break;
        default:
            session.error.message = '通知の状態を変更できませんでした';
            break;
    }

    ctx.redirect('/notice-list');
})

module.exports = router;
