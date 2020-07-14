const Router = require('koa-router');
const router = new Router();
const connection = require('../app/db');
const fs = require('fs');
const path = require('path');
const app = require('../app/app');

router.get('/medicine-delete/:medicine_id', async (ctx) => {
    let session = ctx.session;
    app.initializeSession(session);
    let medicineId = ctx.params['medicine_id'];

    let authId = session.auth_id;
    let userId = await app.getUserId(authId)
    if (!userId) {
        session.error.message = 'ログインしていないため続行できませんでした';

        return ctx.redirect('/login');
    }

    if (!await app.isHaveMedicine(medicineId, userId)) {
        session.error.message = '薬情報が見つかりませんでした';

        return ctx.redirect('/');
    }

    let sql = 'SELECT image FROM medicine WHERE medicine_id = ?';
    let [image] = await connection.query(sql, [medicineId]);
    image = image[0]['image'];
    if (image !== '') {
        fs.unlinkSync(path.join(__dirname, '../public/upload/', image));
    }

    sql = 'DELETE FROM medicine_take_time WHERE medicine_id = ?';
    await connection.query(sql, [medicineId]);

    sql = 'DELETE FROM notice_medicine WHERE medicine_id = ?';
    await connection.query(sql, [medicineId]);

    sql = 'DELETE FROM medicine WHERE medicine_id = ?';
    await connection.query(sql, [medicineId]);

    session.success.message = '薬情報を削除しました';

    ctx.redirect('/medicine-list');
})

module.exports = router;