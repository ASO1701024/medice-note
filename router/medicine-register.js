/*session
register_denied_request: 薬登録失敗時、送信された登録情報をHTMLのformのvalueに設定して表示
register_denied_error: 薬登録失敗時のエラーメッセージ　
*/
const Router = require('koa-router');
const router = new Router();
const app = require('../app/app');
const connection = require('../app/db');
const medicineValidation = require('../app/medicine-validation');

router.get('/medicine-register', async (ctx) => {
    let session = ctx.session;
    if (!session.auth_id) {
        return ctx.redirect('/login');
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
    if (!session.auth_id) {
        return ctx.redirect('/login');
    }

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

    //現在はグループ指定機能が存在しないので、削除不能の初期グループに追加する。
    let sql = 'SELECT group_id FROM medicine_group WHERE user_id = ? AND is_deletable = 1;';
    let userId = await app.getUserId(session.auth_id);
    let group_id = (await connection.query(sql, [userId]))[0][0].group_id;

    let requestArray = [medicineName, hospitalName, number, takeTime, adjustmentTime,
        startsDate, period, medicineType, image, description, group_id];

    //検証パス時は値をDBに保存し、検証拒否時はエラーメッセージを表示
    let result = await medicineValidation(requestArray)
    if (result.is_success) {
        let sql = 'INSERT INTO medicine VALUES(0,?,?,?,?,?,?,?,?,?,?,?)';
        await connection.query(sql, requestArray);
        return ctx.redirect('/medicine-register');
    }
    session.register_denied_request = result.request;
    session.register_denied_error = result.errors;
    return ctx.redirect('/medicine-register');
})
module.exports = router;