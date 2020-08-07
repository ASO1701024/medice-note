const Router = require('koa-router');
const router = new Router();
const app = require('../app/app');
const connection = require('../app/db')

router.get('/api/calendar/', async (ctx) => {
    let session = ctx.session;
    let authKey = session.auth_id;

    if (authKey === undefined || authKey === '') {
        return ctx.body = {
            'status': 400,
            'reason': '必要な値が見つかりませんでした'
        }
    }

    let userId = await app.getUserId(authKey);
    if (!userId) {
        return ctx.body = {
            'status': 400,
            'reason': '不明なユーザーです'
        }
    }

    let start = ctx.request.query['start'];
    let end = ctx.request.query['end'];

    let sql = 'SELECT group_id FROM medicine_group WHERE user_id = ?';
    let [group] = await connection.query(sql, [userId]);
    let group_id = [];

    for (let i = 0; i < group.length; i++) {
        group_id.push(group[i]['group_id']);
    }

    sql = 'SELECT medicine_id as id, medicine_name as title, date_format(starts_date, \'%Y-%m-%d\') as start, ' +
    'date_format(DATE_ADD(starts_date,INTERVAL period DAY), \'%Y-%m-%d\') as end ' +
    'FROM medicine WHERE group_id IN (?)  AND (date_format(starts_date, \'%Y-%m-%d\') ' +
    'BETWEEN ? AND ? OR date_format(DATE_ADD(starts_date,INTERVAL period DAY), \'%Y-%m-%d\') BETWEEN ? AND ?)';

    let [data] = await connection.query(sql, [group_id,start,end,start,end]);

    return ctx.body = data;

})

module.exports = router;