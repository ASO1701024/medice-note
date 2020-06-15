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

    let sql = 'SELECT medicine_id FROM medicine WHERE medicine_id = ? ' +
        'AND group_id in (SELECT group_id FROM medicine_group WHERE user_id = ?)';
    let [medicine] = await connection.query(sql, [medicineId, userId]);
    if (medicine.length === 0) {
        session.error.message = '薬情報が見つかりませんでした';

        return ctx.redirect('/');
    }

    sql = 'DELETE FROM medicine_take_time WHERE medicine_id = ?';
    await connection.query(sql, [medicineId]);

    sql = 'DELETE FROM medicine WHERE medicine_id = ?';
    await connection.query(sql, [medicineId]);

    session.success.message = '薬情報を削除しました';
    ctx.redirect('/');
})

module.exports = router;