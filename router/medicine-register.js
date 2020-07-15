const fs = require('fs');
const path = require('path');
const {v4: uuid} = require('uuid');
const Router = require('koa-router');
const router = new Router();
const app = require('../app/app');
const connection = require('../app/db');

router.get('/medicine-register', async (ctx) => {
    // Session
    let session = ctx.session;
    app.initializeSession(session);

    // Login Check
    let authId = session.auth_id;
    let userId = await app.getUserId(authId);
    if (!userId) {
        session.error.message = 'ログインしていないため続行できませんでした';

        return ctx.redirect('/login');
    }

    let result = app.initializeRenderResult();
    result['data']['meta']['login_status'] = true;
    result['data']['meta']['site_title'] = '薬情報登録 - Medice Note';
    result['data']['meta']['group_list'] = await app.getGroupList(userId);
    result['data']['meta']['css'] = [
        '/stisla/modules/select2/dist/css/select2.min.css',
        '/stisla/modules/bootstrap-daterangepicker/daterangepicker.css',
        'https://code.jquery.com/ui/1.12.1/themes/base/jquery-ui.css'
    ];
    result['data']['meta']['script'] = [
        '/stisla/modules/select2/dist/js/select2.full.min.js',
        '/stisla/modules/bootstrap-daterangepicker/daterangepicker.js',
        'https://code.jquery.com/ui/1.12.1/jquery-ui.js',
        '/js/medicine-form.js'
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

    if (session.old !== undefined) {
        result['data']['old'] = session.old;
        session.old = undefined;
    }

    await ctx.render('/medicine-register', result);
})

router.post('/medicine-register', async (ctx) => {
    // Session
    let session = ctx.session;
    app.initializeSession(session);

    // Login Check
    let authId = session.auth_id;
    let userId = await app.getUserId(authId);
    if (!userId) {
        session.error.message = 'ログインしていないため続行できませんでした';

        return ctx.redirect('/login');
    }

    // Required
    let medicineName = ctx.request.body['medicine_name'];
    let hospitalName = ctx.request.body['hospital_name'];
    let number = ctx.request.body['number'];
    let takeTime = ctx.request.body['take_time'];
    let startsDate = ctx.request.body['starts_date'];
    let period = ctx.request.body['period'];
    let medicineType = ctx.request.body['medicine_type'];
    let groupId = ctx.request.body['group_id'];

    // Any
    let medicineImage = "";
    let description = ctx.request.body.description || '';

    let uploadImage = ctx.request.files['medicine_image'];
    let uploadImageFlag = true;
    if (uploadImage['size'] !== 0) {
        if (1048576 < uploadImage['size']) {
            uploadImageFlag = false;
        }

        switch (app.getExt(uploadImage['name'])) {
            case 'jpeg':
            case 'jpg':
            case 'png':
                break;
            default:
                uploadImageFlag = false;
                break;
        }

        if (!uploadImageFlag) {
            fs.unlinkSync(uploadImage['path']);
        } else {
            medicineImage = uuid().split('-').join('') + uuid().split('-').join('') + '.' + app.getExt(uploadImage['name']);
            fs.renameSync(uploadImage['path'], path.join(__dirname, '../public/upload/', medicineImage));
        }
    } else {
        fs.unlinkSync(uploadImage['path']);
    }

    // Validation
    let validationMedicine = await app.validationMedicine([
        medicineName,
        hospitalName,
        number,
        startsDate,
        period,
        description
    ]);
    let validationTakeTime = await app.validationTakeTime(takeTime);
    let validationMedicineType = await app.validationMedicineType(medicineType);
    let validationGroupId = await app.validationGroupId(groupId, userId);

    if (validationMedicine.result && validationTakeTime && validationMedicineType && validationGroupId && uploadImageFlag) {
        let sql = 'INSERT INTO medicine' +
            '(medicine_name, hospital_name, number, starts_date, period, type_id, image, description, group_id)' +
            'VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)';
        let [medicine] = await connection.query(sql, [
            medicineName,
            hospitalName,
            number,
            startsDate,
            period,
            medicineType,
            medicineImage,
            description,
            groupId
        ]);
        let medicineId = medicine.insertId;
        for (const item of takeTime) {
            let sql = 'INSERT INTO medicine_take_time (medicine_id, take_time_id) VALUES (?, ?)';
            await connection.query(sql, [medicineId, item]);
        }

        session.success.message = '薬情報を登録しました';

        return ctx.redirect('/medicine-list');
    } else {
        session.old = {};
        session.error = validationMedicine.error;
        if (medicineName !== '') session.old.medicine_name = medicineName;
        if (hospitalName !== '') session.old.hospital_name = hospitalName;
        if (number !== '') session.old.number = number;
        if (takeTime !== '' && takeTime !== undefined && takeTime.length > 0) session.old.take_time = (typeof takeTime === "string") ? [takeTime] : takeTime;
        if (startsDate !== '') session.old.starts_date = startsDate;
        if (period !== '') session.old.period = period;
        if (medicineType !== '') session.old.medicine_type = medicineType;
        if (groupId !== '') session.old.group_id = groupId;
        if (description !== '') session.old.description = description;
        if (!uploadImageFlag) session.error.medicine_image = '1MB以内のJPEG・JPG・PNG・ファイルを選択してください';

        if (!validationTakeTime) session.error.take_time = '飲む時間が正しく選択されていません';
        if (!validationMedicineType) session.error.medicine_type = '種類が正しく選択されていません';
        if (!validationGroupId) session.error.medicine_group = '薬グループが正しく選択されていません';

        session.error.message = '薬情報登録に失敗しました';

        return ctx.redirect('/medicine-register');
    }
})

module.exports = router;