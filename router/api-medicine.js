const Router = require('koa-router');
const router = new Router();
const app = require('../app/app');
const connection = require('../app/db')

router.get('/api/medicine/:medicine_id', async (ctx) => {
    let session = ctx.session;

    let authKey = session.auth_id;
    let medicineId = ctx.params['medicine_id'];

    if (authKey === undefined || authKey === '' || medicineId === undefined || medicineId === '') {
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

    if (!await app.isHaveMedicine(medicineId, userId)) {
        return ctx.body = {
            'status': 400,
            'reason': '不明な薬IDです'
        }
    }

    let sql = 'SELECT medicine_id, medicine_name, hospital_name, number, ' +
        'date_format(starts_date, \'%Y年%c月%d日\') as starts_date, period, ' +
        'medicine_type.type_name, medicine_group.group_name, description, medicine.group_id FROM medicine ' +
        'LEFT JOIN medicine_type ON medicine.type_id = medicine_type.type_id ' +
        'LEFT JOIN medicine_group ON medicine.group_id = medicine_group.group_id ' +
        'WHERE medicine_id = ?';
    let [data] = await connection.query(sql, [medicineId]);
    let result = data[0];

    sql = 'SELECT take_time_name FROM medicine_take_time ' +
        'LEFT JOIN take_time ON medicine_take_time.take_time_id = take_time.take_time_id ' +
        'WHERE medicine_id = ?';
    [data] = await connection.query(sql, [medicineId]);
    let array = [];
    for (let i = 0; i < data.length; i++) {
        array.push(data[i]['take_time_name'])
    }
    result['take_time'] = array;

    return ctx.body = {
        'status': 200,
        'data': result
    }
})

module.exports = router;