const Router = require('koa-router');
const router = new Router();
const app = require('../app/app');
const connection = require('../app/db');

/* session
register_denied_request: 薬登録失敗時、送信された登録情報をHTMLのformのvalueに設定して表示
register_denied_error: 薬登録失敗時のエラーメッセージ　
*/

router.get('/medicine-register', async (ctx) => {
    let session = ctx.session;

    let userId = await app.getUserId(session.auth_id);
    if (userId === false) {
        return ctx.redirect('/')
    }

    let result = {};
    if (session.register_denied_error) {
        result['data'] = {};
        result['data']['errorMsg'] = session.register_denied_error;
        result['data']['request'] = session.register_denied_request;
    }
    session.register_denied_error = null;
    session.register_denied_request = null;

    await ctx.render('/medicine-register', result);
})

router.post('/medicine-register', async (ctx) => {
    let session = ctx.session;

    let userId = await app.getUserId(session.auth_id);
    if (userId === false) {
        return ctx.redirect('/')
    }

    // medicineテーブルに登録する項目
    // 必須項目
    let medicineName = ctx.request.body['medicineName'];
    let hospitalName = ctx.request.body['hospitalName'];
    let number = ctx.request.body['number'];
    let startsDate = ctx.request.body['startsDate'];
    let period = ctx.request.body['period'];
    let medicineType = ctx.request.body['medicineType'];
    // 任意項目
    let image = "";
    let description = ctx.request.body['description'] || '';

    // medicine_take_timeテーブルに登録する項目
    let takeTimeArray = ctx.request.body['takeTime'] || [];

    // 削除不能の初期グループのgroup_idを取得
    let sql = 'SELECT group_id FROM medicine_group WHERE user_id = ? AND is_deletable = 1;';
    let groupId = (await connection.query(sql, [userId]))[0][0]['group_id'];

    let medicineArray = [medicineName, hospitalName, number,
        startsDate, period, medicineType, image, description, groupId];
    // 検証パス時は値をDBに保存し、検証拒否時はエラーメッセージを表示
    let validationPromise = [];
    let validationResultArray = [];
    validationPromise[0] = app.medicineValidation(medicineArray, userId).then(result => validationResultArray[0] = result);
    validationPromise[1] = app.takeTimeValidation(takeTimeArray).then(result => validationResultArray[1] = result);
    await Promise.all(validationPromise);

    if (validationResultArray[0].is_success && validationResultArray[1].is_success) {
        // medicineを登録し、medicine_idを取得
        let medicineSQL = 'INSERT INTO medicine VALUES(0,?,?,?,?,?,?,?,?,?);';
        let medicineInsertResult = await connection.query(medicineSQL, medicineArray);
        let insertId = medicineInsertResult[0].insertId;
        // medicine_take_timeを登録
        let takeTimeSQL = 'INSERT INTO medicine_take_time VALUES(?,?);';
        // 1行ずつコミットしないとエラーが出るので、毎回awaitしてます。本来はtransactionとか使うそうな。
        for (let takeTime of takeTimeArray) {
            await connection.query(takeTimeSQL, [insertId, takeTime]);
        }
        return ctx.redirect('/medicine-register');
    } else {
        if (validationResultArray[1].errors.array === '') {
            validationResultArray[0].errors.takeTime = validationResultArray[1].errors.items[0];
        } else {
            validationResultArray[0].errors.takeTime = validationResultArray[1].errors.array;
        }
        validationResultArray[0].request.takeTime = takeTimeArray;
        session.register_denied_request = validationResultArray[0].request;
        session.register_denied_error = validationResultArray[0].errors;
        return ctx.redirect('/medicine-register');
    }
})

module.exports = router;