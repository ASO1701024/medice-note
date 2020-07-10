const connection = require('./db');
const validator = require('validatorjs');

module.exports = {
    getUserId: async (authId) => {
        if (authId === undefined) return false;
        let sql = 'SELECT user_id FROM session WHERE session_id = ? AND expired_at >= ?';
        let [auth] = await connection.query(sql, [authId, new Date()]);
        if (auth.length === 0) {
            return false;
        }
        return auth[0]['user_id'];
    },
    getDefaultGroup: async (userId) => {
        let sql = 'SELECT group_id FROM medicine_group WHERE user_id = ? AND is_deletable = 1';
        let [group] = await connection.query(sql, [userId]);
        if (group.length === 0) {
            return false;
        }
        return group[0]['group_id'];
    },
    getGroupList: async (userId) => {
        let sql = 'SELECT group_id, group_name FROM medicine_group WHERE user_id = ?';
        let [group] = await connection.query(sql, [userId]);
        return group;
    },
    validationMedicine: async (array) => {
        let requests = {
            medicineName: array[0],
            hospitalName: array[1],
            number: array[2],
            startsDate: array[3],
            period: array[4],
            description: array[5]
        };
        // Rule
        let rules = {
            medicineName: 'required|max:200',
            hospitalName: 'required|max:100',
            number: 'required|numeric|min:0|max:99',
            startsDate: 'required|date',
            period: 'required|numeric|min:0|max:1000',
            description: 'max:255'
        };
        // Message
        let errorMessage = {
            'required.medicineName': "200文字以内で入力してください",
            'max.medicineName': "200文字以内で入力してください",
            'required.hospitalName': "100文字以内で入力してください",
            'max.hospitalName': "100文字以内で入力してください",
            'required.number': "0以上99以下の数字で入力してください",
            'numeric.number': "0以上99以下の数字で入力してください",
            'min.number': "0以上99以下の数字で入力してください",
            'max.number': "0以上99以下の数字で入力してください",
            'required.startsDate': "日付の書式で入力してください",
            'date.startsDate': "日付の書式で入力してください",
            'required.period': "0以上で1000以内の数字で入力してください",
            'numeric.period': "0以上で1000以内の数字で入力してください",
            'min.period': "0以上で1000以内の数字で入力してください",
            'max.period': "0以上で1000以内の数字で入力してください",
            'max.description': "255文字以内で入力してください"
        }
        // Validation
        let requestValidate = new validator(requests, rules, errorMessage);

        let result = {
            error: {},
            result: false
        };
        await requestValidate.checkAsync(() => {
            // Success
            result.result = true;
        }, () => {
            // Error
            result.result = false;
            if (requestValidate.errors.first('medicineName')) {
                result.error.medicine_name = requestValidate.errors.first('medicineName');
            }
            if (requestValidate.errors.first('hospitalName')) {
                result.error.hospital_name = requestValidate.errors.first('hospitalName');
            }
            if (requestValidate.errors.first('number')) {
                result.error.number = requestValidate.errors.first('number');
            }
            if (requestValidate.errors.first('startsDate')) {
                result.error.starts_date = requestValidate.errors.first('startsDate');
            }
            if (requestValidate.errors.first('period')) {
                result.error.period = requestValidate.errors.first('period');
            }
            if (requestValidate.errors.first('description')) {
                result.error.description = requestValidate.errors.first('description');
            }
        })

        return result;
    },
    validationTakeTime: async (array) => {
        if (array === '' || array === undefined) return false;

        for (let i = 0; i < array.length; i++) {
            let sql = 'SELECT take_time_id FROM take_time WHERE take_time_id = ?';
            let [data] = await connection.query(sql, [array[i]]);
            if (data.length === 0) {
                return false;
            }
        }
        return true;
    },
    validationMedicineType: async (item) => {
        let sql = 'SELECT type_id FROM medicine_type WHERE type_id = ?';
        let [data] = await connection.query(sql, [item]);
        return data.length !== 0;
    },
    getExt: (filename) => {
        let pos = filename.lastIndexOf('.');
        if (pos === -1) return '';
        return filename.slice(pos + 1);
    },
    isHaveMedicine: async (medicineId, userId) => {
        let sql = 'SELECT medicine_id FROM medicine WHERE medicine_id = ? ' +
            'AND group_id in (SELECT group_id FROM medicine_group WHERE user_id = ?)';
        let [medicine] = await connection.query(sql, [medicineId, userId]);
        return medicine.length !== 0;
    },
    getMedicineFromMedicineId: async (medicineId) => {
        let sql = 'SELECT medicine_id, medicine_name, hospital_name, number, ' +
            'date_format(starts_date, \'%Y-%m-%d\') as starts_date, period, type_id, group_id, image, description ' +
            'FROM medicine ' +
            'WHERE medicine_id = ?';
        let [medicine] = await connection.query(sql, [medicineId]);
        if (medicine.length === 0) {
            return false;
        }
        sql = 'SELECT take_time_id FROM medicine_take_time WHERE medicine_id = ?';
        let [takeTime] = await connection.query(sql, [medicineId]);
        let array = [];
        for (let i = 0; i < takeTime.length; i++) {
            array.push(takeTime[i]['take_time_id']);
        }
        return {
            medicine_id: medicine[0]['medicine_id'],
            medicine_name: medicine[0]['medicine_name'],
            hospital_name: medicine[0]['hospital_name'],
            number: medicine[0]['number'],
            starts_date: medicine[0]['starts_date'],
            period: medicine[0]['period'],
            type_id: medicine[0]['type_id'],
            group_id: medicine[0]['group_id'],
            image: medicine[0]['period'],
            description: medicine[0]['description'],
            take_time: array
        };
    },
    initializeRenderResult: () => {
        let result = {};
        result['data'] = {};
        result['data']['old'] = {};
        result['data']['success'] = {};
        result['data']['error'] = {};
        result['data']['meta'] = {};

        return result;
    },
    initializeSession: (session) => {
        if (session.error === undefined) {
            session.error = {};
        }
        if (session.success === undefined) {
            session.success = {};
        }
        if (session.old === undefined) {
            session.old = {};
        }
    },
    validationGroupId: async (groupId, userId) => {
        let sql = 'SELECT group_id FROM medicine_group WHERE group_id = ? AND user_id = ?';
        let [group] = await connection.query(sql, [groupId, userId]);
        return group.length !== 0;
    },
    validationNoticeName: (noticeName) => {
        let validation = new validator({
            noticeName: noticeName
        }, {
            noticeName: 'required|string|min:1|max:100'
        });
        return validation.passes();
    },
    validationNoticeMedicineId: async (medicineId, userId) => {
        if (medicineId === '' || medicineId === undefined || medicineId.length <= 0) return false;

        for (let i = 0; i < medicineId.length; i++) {
            let sql = 'SELECT medicine_id FROM medicine WHERE medicine_id = ? ' +
                'AND group_id in (SELECT group_id FROM medicine_group WHERE user_id = ?)';
            let [medicine] = await connection.query(sql, [medicineId[i], userId]);
            if (medicine.length === 0) {
                return false;
            }
        }
        return true;
    },
    validationNoticeTime: (noticeTime) => {
        if (noticeTime === '' || noticeTime === undefined || noticeTime.length <= 0) return false;

        for (let i = 0; i < noticeTime.length; i++) {
            let validation = new validator({
                time: noticeTime[i]
            }, {
                time: ['required', 'regex:/^([0-9]|0[0-9]|1[0-9]|2[0-3]):[0-5][0-9]$/']
            });
            if (validation.fails()) {
                return false;
            }
        }
        return true;
    },
    validationNoticeDay: (noticeWeek) => {
        if (noticeWeek === '' || noticeWeek === undefined) return false;

        for (let i = 0; i < noticeWeek.length; i++) {
            let validation = new validator({
                week: noticeWeek[i]
            }, {
                week: ['required', { 'in': ['0', '1', '2', '3', '4', '5', '6'] }]
            });
            if (validation.fails()) {
                return false;
            }
        }
        return true;
    },
    validationEndDate: (endDate) => {
        let validation = new validator({
            endDate: endDate
        }, {
            endDate: 'required|date'
        });
        return validation.passes();
    }
}
