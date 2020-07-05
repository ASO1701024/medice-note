const fs = require('fs');
const path = require('path');
const Router = require('koa-router');
const router = new Router();
const connection = require('../app/db');
const app = require('../app/app');
const { v4: uuid } = require('uuid');

router.get('/medicine-update/:medicine_id', async (ctx) => {
    let session = ctx.session;
    app.initializeSession(session);
    let medicineId = ctx.params['medicine_id'];

    let authId = session.auth_id;
    if (!authId || !await app.getUserId(authId)) {
        return ctx.redirect('/login');
    }
    let userId = await app.getUserId(authId);
    if (!await app.isHaveMedicine(medicineId, userId)) {
        session.error.message = '薬情報が見つかりませんでした';

        return ctx.redirect('/');
    }

    let result = app.initializeRenderResult();

    let sql = 'SELECT type_id, type_name FROM medicine_type';
    let [medicineType] = await connection.query(sql);
    result['data']['meta']['medicine_type'] = medicineType;

    sql = 'SELECT take_time_id, take_time_name FROM take_time';
    let [takeTime] = await connection.query(sql);
    result['data']['meta']['take_time'] = takeTime;

    result['data']['meta']['login_status'] = true;
    result['data']['meta']['site_title'] = '薬情報更新 - Medice Note';
    result['data']['meta']['group_list'] = await app.getGroupList(userId);

    result['data']['old'] = await app.getMedicineFromMedicineId(medicineId);
    result['data']['meta']['css'] = [
        '/stisla/modules/select2/dist/css/select2.min.css',
        'https://code.jquery.com/ui/1.12.1/themes/base/jquery-ui.css'
    ];
    result['data']['meta']['script'] = [
        '/stisla/modules/select2/dist/js/select2.full.min.js',
        'https://code.jquery.com/ui/1.12.1/jquery-ui.js',
        '/js/medicine-form.js'
    ];

    if (session.old !== undefined && Object.keys(session.old).length !== 0) {
        result['data']['old'] = session.old;
        session.old = undefined;
    }

    if (session.error !== undefined) {
        result['data']['error'] = session.error;
        session.error = undefined;
    }

    await ctx.render('/medicine-update', result);
})

router.post('/medicine-update/:medicine_id', async (ctx) => {
    let session = ctx.session;
    app.initializeSession(session);

    let medicineId = ctx.params['medicine_id'];

    // Session
    let authId = session.auth_id;
    let userId = await app.getUserId(authId);
    if (!userId) {
        session.error.message = 'ログインしていないため続行できません';

        return ctx.redirect('/login');
    }

    // Lookup MedicineId
    if (!await app.isHaveMedicine(medicineId, userId)) {
        session.error.message = '薬情報が見つかりませんでした';

        return ctx.redirect('/');
    }

    let medicineName = ctx.request.body['medicine_name'];
    let hospitalName = ctx.request.body['hospital_name'];
    let number = ctx.request.body['number'];
    let takeTime = ctx.request.body['take_time'];
    let startsDate = ctx.request.body['starts_date'];
    let period = ctx.request.body['period'];
    let medicineType = ctx.request.body['medicine_type'];
    let groupId = ctx.request.body['group_id'];

    // 任意項目
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
        // Update Medicine
        let sql = 'UPDATE medicine SET medicine_name = ?, hospital_name = ?, number = ?, starts_date = ?, ' +
            'period = ?, type_id = ?, group_id = ?, image = ?, description = ? WHERE medicine_id = ?';
        await connection.query(sql, [medicineName, hospitalName, number, startsDate, period, medicineType, groupId, medicineImage, description, medicineId]);

        // Delete TakeTime
        sql = 'DELETE FROM medicine_take_time WHERE medicine_id = ?';
        await connection.query(sql, [medicineId]);

        // Insert TakeTime
        for (const item of takeTime) {
            let sql = 'INSERT INTO medicine_take_time (medicine_id, take_time_id) VALUES (?, ?)';
            await connection.query(sql, [medicineId, item]);
        }

        session.success.message = '薬情報を更新しました';

        return ctx.redirect('/');
    } else {
        session.old = {};
        session.error = validationMedicine.error;
        session.old.medicine_id = medicineId;
        if (medicineName !== '') session.old.medicine_name = medicineName;
        if (hospitalName !== '') session.old.hospital_name = hospitalName;
        if (number !== '') session.old.number = number;
        if (takeTime !== '' && takeTime !== undefined && takeTime.length > 0) session.old.take_time = (typeof takeTime === "string") ? [takeTime] : takeTime;
        if (startsDate !== '') session.old.starts_date = startsDate;
        if (period !== '') session.old.period = period;
        if (medicineType !== '') session.old.type_id = medicineType;
        if (groupId !== '') session.old.group_id = groupId;
        if (description !== '') session.old.description = description;
        if (!uploadImageFlag) session.error.medicine_image = '1MB以内のJPEG・JPG・PNG・ファイルを選択してください';

        if (!validationTakeTime) session.error.take_time = '飲む時間が正しく選択されていません';
        if (!validationMedicineType) session.error.medicine_type = '種類が正しく選択されていません';
        if (!validationGroupId) session.error.group_id = 'グループが正しく選択されていません';

        session.error.message = '薬情報の更新に失敗しました';

        return ctx.redirect('/medicine-update/' + medicineId);
    }
})

module.exports = router;