/*session
update_medicine_id: 更新する薬情報の薬ID
update_denied_error: 薬情報変更失敗時のエラーメッセージ　
*/
const Router = require('koa-router');
const router = new Router();
const app = require('../app/app');
const connection = require('../app/db');
const medicineValidation = require('../app/medicine-validation.js');
const getMedicine = require('../app/get_medicine');

router.get('/medicine-update/:medicine_id', async (ctx) => {
    let session = ctx.session;
    let medicineId = ctx.params.medicine_id;

    if (!session.auth_id) {
        return ctx.redirect('/login');
    }

    let result = {};
    result['data'] = {};
    if (session.update_denied_error) {
        result['data']['errorMsg'] = session.update_denied_error;
        session.update_denied_error = null;
    }

    let medicineData = await getMedicine(medicineId, session.auth_id);
    if (medicineData === false) {
        //薬一覧に遷移するように後で変更する。
        return ctx.redirect('/');
    }

    //renderに渡す為にデータを成形
    result['data']['request'] = {};
    result['data']['request']['medicineID'] = medicineId;
    for (let key in medicineData) {
        if (medicineData.hasOwnProperty(key)) {
            result['data']['request'][key] = medicineData[key];
        }
    }
    await ctx.render('/medicine-update', result);
})

router.post('/medicine-update/:medicine_id', async (ctx) => {
    let session = ctx.session;
    let medicineId = ctx.params.medicine_id;
    if (!session.auth_id) {
        return ctx.redirect('/login');
    }

    let medicineData = getMedicine(medicineId, session.auth_id);
    //更新権限の有無の確認。間違えて使わないように確認後はnullで初期化。
    if (medicineData === false) {
        //薬一覧に遷移するように後で変更する。
        return ctx.redirect('/');
    }
    medicineData = null;

    //必須項目
    let medicineName = ctx.request.body.medicineName;
    let hospitalName = ctx.request.body.hospitalName;
    let number = ctx.request.body.number;
    let takeTime = ctx.request.body.takeTime;
    let adjustmentTime = ctx.request.body.adjustmentTime;
    let startsDate = ctx.request.body.startsDate;
    let period = ctx.request.body.period;
    let medicineType = ctx.request.body.medicineType;

    //任意項目
    let image = "";
    let description = ctx.request.body.description || '';

    let sql = 'SELECT group_id FROM medicine_group WHERE user_id = ? AND is_deletable = 1;';
    let userId = await app.getUserId(session.auth_id);
    let group_id = (await connection.query(sql, [userId]))[0][0].group_id;

    let requestArray = [medicineName, hospitalName, number, takeTime, adjustmentTime,
        startsDate, period, medicineType, image, description, String(group_id), medicineId];

    //検証パス時は値をDBに保存し、検証拒否時はエラーメッセージを表示
    let result = await medicineValidation(requestArray);
    if (result.is_success) {
        let sql = 'UPDATE medicine ' +
            'SET medicine_name=?,hospital_name=?,number=?,take_time=?,adjustment_time=?,' +
            'starts_date=?,period=?,type_id=?,image=?,description=?,group_id=? ' +
            'WHERE medicine_id = ?';
        await connection.query(sql, requestArray);
        return ctx.redirect('/medicine-update/' + medicineId);
    } else {
        session.update_denied_error = result.errors;
        return ctx.redirect('/medicine-update/' + medicineId);
    }
})
module.exports = router;