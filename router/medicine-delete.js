const Router = require('koa-router');
const router = new Router();
const connection = require('../app/db');
const app = require('../app/app');

router.get('/medicine-delete/:medicine_id', async (ctx) => {
    let session = ctx.session;
    let medicineId = ctx.params['medicine_id'];

    let authId = session.auth_id;
    if (!authId || !await app.getUserId(authId)) {
        return ctx.redirect('/login');
    }
    let userId = await app.getUserId(authId);

    if (!await app.isHaveMedicine(medicineId, userId)) {
        session.error.message = '薬情報が見つかりませんでした';

        return ctx.redirect('/');
    }

    let sql = 'DELETE FROM medicine_take_time WHERE medicine_id = ?';
    await connection.query(sql, [medicineId]);

    sql = 'DELETE FROM medicine WHERE medicine_id = ?';
    await connection.query(sql, [medicineId]);

    session.success.message = '薬情報を削除しました';
    ctx.redirect('/');
})

module.exports = router;