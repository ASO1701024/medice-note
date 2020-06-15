const Router = require('koa-router');
const router = new Router();
const app = require('../app/app');
const connection = require('../app/db');

router.get('/', async (ctx) => {
    let session = ctx.session;

    let result = {};
    result['meta'] = {};
    result['meta']['login_status'] = await app.getUserId(session.auth_id);

    if (session.auth_id === undefined) {
        return await ctx.render('index', result);
    }

    let authId = session.auth_id;
    let userId = await app.getUserId(authId);

    let sql = 'SELECT medicine_id, medicine_name, hospital_name, number, ' +
        'date_format(starts_date, \'%Y年%c月%d日\') as starts_date, period, ' +
        'medicine_type.type_name, image, description, group_id FROM medicine ' +
        'LEFT JOIN medicine_type ON medicine.type_id = medicine_type.type_id ' +
        'WHERE group_id in (SELECT group_id FROM medicine_group WHERE user_id = ?)'

    let [data] = await connection.query(sql, [userId]);
    result['data'] = data;

    await ctx.render('medicine-list', result);
})

module.exports = router;
