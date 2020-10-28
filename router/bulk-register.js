const Router = require('koa-router');
const router = new Router();
const app = require('../app/app');
const connection = require('../app/db');
const Validator = require('validatorjs');

router.get('/bulk-register', async (ctx) => {
    let session = ctx.session;
    app.initializeSession(session);

    let authId = session.auth_id;
    let userId = await app.getUserId(authId);
    if (!userId) {
        session.error.message = 'ログインしていないため続行できませんでした';

        return ctx.redirect('/login');
    }

    let result = app.initializeRenderResult();
    result['data']['meta']['login_status'] = true;
    result['data']['meta']['site_title'] = '薬情報一括登録 - Medice Note';
    result['data']['meta']['group_list'] = await app.getGroupList(userId);
    result['data']['meta']['css'] = [
        '/stisla/modules/select2/dist/css/select2.min.css',
        '/stisla/modules/bootstrap-daterangepicker/daterangepicker.css',
        '/css/library/jquery-ui.min.css',
        '/css/library/notyf.min.css'
    ];
    result['data']['meta']['script'] = [
        '/stisla/modules/select2/dist/js/select2.full.min.js',
        '/stisla/modules/bootstrap-daterangepicker/daterangepicker.js',
        '/stisla/modules/sweetalert/sweetalert.min.js',
        '/js/library/jquery-ui.min.js',
        '/js/library/notyf.min.js',
        '/js/library/handlebars.min.js',
        '/js/medicine-bulk-register.js',
    ];

    let sql = 'SELECT type_id, type_name FROM medicine_type';
    let [medicineType] = await connection.query(sql);
    result['data']['meta']['medicine_type'] = medicineType;

    sql = 'SELECT take_time_id, take_time_name FROM take_time';
    let [takeTime] = await connection.query(sql);
    result['data']['meta']['take_time'] = takeTime;

    if (session.error !== undefined) {
        result['data']['error'] = session.error;
        session.error = undefined;
    }
    if (session.success !== undefined) {
        result['data']['success'] = session.success;
        session.success = undefined;
    }

    await ctx.render('bulk-register', result);
});

router.post('/bulk-register', async (ctx) => {
    let session = ctx.session;
    app.initializeSession(session);

    let authId = session.auth_id;
    let userId = await app.getUserId(authId);
    if (!userId) {
        session.error.message = 'ログインしていないため続行できませんでした';

        return ctx.redirect('/login');
    }

    let referer = ctx.request.header['referer'];
    let contentType = ctx.request.header['content-type'];
    let parser = new URL(referer);
    if (parser.pathname !== '/bulk-register' || contentType !== 'application/json') {
        return ctx.body = {
            'status': false,
            'message': '不明なリクエストが発生しました'
        };
    }

    let json = ctx.request.body;

    let hospitalName = json['hospital_name'];
    let startsDate = json['starts_date'];
    let groupId = json['group_id'];

    let validate = await validateMedicineBasic(hospitalName, startsDate, groupId, userId);

    let items = json['item'];
    for (let i = 1; i < items.length; i++) {
        let medicineName = items[i]['medicine_name'];
        let takeTime = items[i]['take_time'];
        let number = items[i]['number'];
        let period = items[i]['period'];
        let medicineType = items[i]['medicine_type'];

        let temp = await validateMedicineItem(medicineName, takeTime, number, period, medicineType)
        if (Object.keys(temp).length !== 0) {
            if (validate['item'] === undefined) {
                validate['item'] = [];
            }
            validate['item'][i] = temp;
        }
    }

    if (Object.keys(validate).length === 0) {
        for (let i = 1; i < items.length; i++) {
            let sql = `
                INSERT INTO medicine (medicine_name, hospital_name, number, starts_date, period, type_id, group_id)
                VALUES (?, ?, ?, ?, ?, ?, ?)`;
            let [medicine] = await connection.query(sql, [
                items[i]['medicine_name'], hospitalName, items[i]['number'],
                startsDate, items[i]['period'], items[i]['medicine_type'], groupId
            ]);
            let medicineId = medicine.insertId;
            for (const item of items[i]['take_time']) {
                let sql = 'INSERT INTO medicine_take_time (medicine_id, take_time_id) VALUES (?, ?)';
                await connection.query(sql, [medicineId, item]);
            }
        }

        session.success.message = '薬情報を登録しました';
        return ctx.body = {
            'status': true
        }
    } else {
        return ctx.body = {
            'status': false,
            'message': '正しく入力されていない項目があります',
            'error': validate
        };
    }
});

async function validateMedicineBasic(hospitalName, startsDate, groupId, userId) {
    let validateResult = {};

    let validate = new Validator({
        hospitalName: hospitalName,
        startsDate: startsDate
    }, {
        hospitalName: 'required|string|min:1|max:20',
        startsDate: 'required|date',
    }, {
        'required.hospitalName': '100文字以内で入力してください',
        'string.hospitalName': '100文字以内で入力してください',
        'min.hospitalName': '100文字以内で入力してください',
        'max.hospitalName': '100文字以内で入力してください',
        'required.startsDate': '日付の書式で入力してください',
        'date.startsDate': '日付の書式で入力してください'
    });

    await validate.checkAsync(() => {

    }, () => {
        if (validate.errors.first('hospitalName')) {
            validateResult['hospital_name'] = validate.errors.first('hospitalName');
        }
        if (validate.errors.first('startsDate')) {
            validateResult['starts_date'] = validate.errors.first('startsDate');
        }
    });

    let sql = 'SELECT group_id FROM medicine_group WHERE user_id = ?';
    let [group] = await connection.query(sql, [userId]);

    let haveGroupId = group.map(item => item['group_id']);
    if (!haveGroupId.some(value => parseInt(value) === parseInt(groupId))) {
        validateResult['group_id'] = 'グループ情報が見つかりませんでした';
    }

    return validateResult;
}

async function validateMedicineItem(medicineName, takeTime, number, period, medicineType) {
    let validateResult = {};

    let validate = new Validator({
        medicineName: medicineName,
        number: number,
        period: period
    }, {
        medicineName: 'required|max:200',
        number: 'required|numeric|min:0|max:99',
        period: 'required|numeric|min:0|max:1000',
    }, {
        'required.medicineName': '200文字以内で入力してください',
        'max.medicineName': '200文字以内で入力してください',
        'required.number': '0以上99以下の数字で入力してください',
        'numeric.number': '0以上99以下の数字で入力してください',
        'min.number': '0以上99以下の数字で入力してください',
        'max.number': '0以上99以下の数字で入力してください',
        'required.period': '0以上で1000以内の数字で入力してください',
        'numeric.period': '0以上で1000以内の数字で入力してください',
        'min.period': '0以上で1000以内の数字で入力してください',
        'max.period': '0以上で1000以内の数字で入力してください'
    });
    await validate.checkAsync(() => {

    }, () => {
        if (validate.errors.first('medicineName')) {
            validateResult['medicine_name'] = validate.errors.first('medicineName');
        }
        if (validate.errors.first('number')) {
            validateResult['number'] = validate.errors.first('number');
        }
        if (validate.errors.first('period')) {
            validateResult['period'] = validate.errors.first('period');
        }
    });

    if (takeTime === '' || takeTime === undefined || takeTime.length <= 0) {
        validateResult['take_time'] = '飲む時間が正しく選択されていません';
    } else {
        let sql = 'SELECT take_time_id FROM take_time';
        let [data] = await connection.query(sql);
        let masterTakeTime = data.map(item => item['take_time_id']);
        for (let i = 0; i < takeTime.length; i++) {
            if (!masterTakeTime.some(value => parseInt(value) === parseInt(takeTime[i]))) {
                validateResult['take_time'] = '飲む時間が正しく選択されていません';
                break;
            }
        }
    }

    let sql = 'SELECT type_id FROM medicine_type';
    let [data] = await connection.query(sql);
    let masterMedicineType = data.map(item => item['type_id']);
    if (!masterMedicineType.some(value => parseInt(value) === parseInt(medicineType))) {
        validateResult['medicine_type'] = '種類が正しく選択されていません';
    }

    return validateResult;
}

module.exports = router;
