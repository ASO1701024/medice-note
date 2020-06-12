/*session
update_medicine_id: 更新する薬情報の薬ID
update_denied_error: 薬情報変更失敗時のエラーメッセージ　
*/
const Router = require('koa-router');
const router = new Router();
const app = require('../app/app');
const connection = require('../app/db');
const medicineValidation = require('./medicine-validation.js');

router.get('/medicine-update/:medicine_id', async (ctx) => {
    let session = ctx.session;
    let medicineId = ctx.params.medicine_id;
    session.update_medicine_id = medicineId;
    if (!session.auth_id) {
        return ctx.redirect('/login');
    }

    let result = {};
    result['data'] = {};
    if (session.update_denied_error) {
        result['data']['errorMsg'] = session.update_denied_error;
        session.update_denied_error = null;
    }

    //medicineテーブルのmedicine_id以外を取得
    let sql =
        'SELECT medicine_name as medicineName,' +
        'hospital_name as hospitalName,' +
        'number,' +
        'take_time as takeTime,' +
        'adjustment_time as adjustmentTime,' +
        'DATE_FORMAT(starts_date, "%Y-%m-%d") as startsDate,' +
        'period,' +
        'type_id as medicineType,' +
        'image,' +
        'description,' +
        'group_id as groupId ' +
        'FROM medicine M ' +
        'WHERE M.group_id in (SELECT group_id FROM medicine_group WHERE user_id = ?) ' +
        'AND medicine_id = ?';
    let userId = await app.getUserId(session.auth_id);
    let medicineResult = (await connection.query(sql, [userId, medicineId]))[0][0];

    //存在しないmedice_idの指定、もしくは自分以外が作成した薬情報を指定した時の処理
    if (typeof medicineResult === 'undefined') {
        return ctx.redirect('/medicine-register')
    }

    //renderに渡す為にデータを成形
    result['data']['request'] = {}
    result['data']['request']['startsYear'] = medicineResult['startsDate'].split('-')[0];
    result['data']['request']['startsMonth'] = medicineResult['startsDate'].split('-')[1];
    result['data']['request']['startsDay'] = medicineResult['startsDate'].split('-')[2];
    for (let key in medicineResult) {
        result['data']['request'][key] = medicineResult[key];
    }
    await ctx.render('/medicine-update', result);
})

router.post('/medicine-update', async (ctx) => {
    let session = ctx.session;
    if (!session.auth_id) {
        return ctx.redirect('/login');
    }
    let updateMedicineId = session.update_medicine_id;
    session.update_medicine_id = null;

    //必須項目
    let medicineName = ctx.request.body.medicineName;
    let hospitalName = ctx.request.body.hospitalName;
    let number = ctx.request.body.number;
    let takeTime = ctx.request.body.takeTime;
    let adjustmentTime = ctx.request.body.adjustmentTime;
    let period = ctx.request.body.period;
    let medicineType = ctx.request.body.medicineType;

    let startsYear = ctx.request.body.startsYear;
    let startsMonth = ctx.request.body.startsMonth;
    let startsDay = ctx.request.body.startsDay;
    let startsDate = startsYear + '-' + startsMonth + '-' + startsDay;

    //任意項目
    let image = "";
    let description = ctx.request.body.description || '';

    let sql = 'SELECT MG.group_id FROM medicine_group MG WHERE MG.user_id = ? AND MG.is_deletable = 1;';
    let userId = await app.getUserId(session.auth_id);
    let group_id = (await connection.query(sql, [userId]))[0][0].group_id;

    let requestArray = [medicineName, hospitalName, number, takeTime, adjustmentTime,
        startsDate, period, medicineType, image, description, group_id, updateMedicineId];

    //検証パス時は値をDBに保存し、検証拒否時はエラーメッセージを表示
    return await asyncValidation(requestArray);

    async function asyncValidation(data) {
        let result = await medicineValidation(data)
        if (result.is_success) {
            console.log("success");
            let sql = 'UPDATE medicine ' +
                'SET medicine_name=?,hospital_name=?,number=?,take_time=?,adjustment_time=?' +
                ',starts_date=?,period=?,type_id=?,image=?,description=?,group_id=? ' +
                'WHERE medicine_id = ?';
            await connection.query(sql, requestArray);
            return ctx.redirect('/medicine-update/' + updateMedicineId);
        } else {
            console.log("false");
            session.update_denied_error = result.errors;
            return ctx.redirect('/medicine-update/' + updateMedicineId);
        }
    }
})
module.exports = router;