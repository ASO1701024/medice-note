const Router = require('koa-router');
const router = new Router();
const connection = require('../app/db');
const app = require('../app/app');

router.post('/medicine-delete', async (ctx) => {
    let session = ctx.session;

    let userId = await app.getUserId(session.auth_id);
    if (userId === false) {
        return ctx.redirect('/')
    }
    let medicineId = ctx.request.body['medicineId'];

    // 削除対象の薬情報が存在し、その所有者からのリクエストであることを確認。
    let medicineData = await app.getMedicine(medicineId, userId);
    if (medicineData === false) {
        // 薬一覧に遷移するように後で変更する。
        return ctx.redirect('/');
    }

    // 通知機能実装後、medicine_notice_timeの情報も削除するよう変更すること。
    let sql = 'DELETE FROM medicine_take_time WHERE medicine_id = ?;';
    await connection.query(sql, [medicineId]);
    sql = 'DELETE FROM medicine WHERE medicine_id = ?;';
    await connection.query(sql, [medicineId]);

    return ctx.redirect('/');
})

module.exports = router;