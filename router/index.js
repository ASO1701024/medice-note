const Router = require('koa-router');
const router = new Router();
const app = require('../app/app');
const connection = require('../app/db');

router.get('/', async (ctx) => {
    let session = ctx.session;

    let result = app.initializeRenderResult();

    let authId = session.auth_id;
    let userId = await app.getUserId(authId);
    result['data']['meta']['login_status'] = Boolean(userId);
    result['data']['meta']['site_title'] = 'トップページ - Medice Note';

    await ctx.render('index', result);

    // let sql = 'SELECT medicine_id, medicine_name, hospital_name, number, ' +
    //     'date_format(starts_date, \'%Y年%c月%d日\') as starts_date, period, ' +
    //     'medicine_type.type_name, image, description, group_id FROM medicine ' +
    //     'LEFT JOIN medicine_type ON medicine.type_id = medicine_type.type_id ' +
    //     'WHERE group_id in (SELECT group_id FROM medicine_group WHERE user_id = ?)'
    //
    // let [data] = await connection.query(sql, [userId]);
    // result['data']['medicine_list'] = data;
    //
    // session.success = {};
    // session.error = {};
    //
    // result['data']['meta']['site_title'] = '薬情報一覧 - Medice Note';
    //
    // if (session.success.message !== undefined) {
    //     result['data']['success']['message'] = session.success.message;
    //     session.success.message = undefined;
    // }
    //
    // if (session.error.message !== undefined) {
    //     result['data']['error']['message'] = session.error.message;
    //     session.error.message = undefined;
    // }

    // await ctx.render('medicine-list', result);
})

module.exports = router;
