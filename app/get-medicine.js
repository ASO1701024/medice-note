const app = require('../app/app');
const connection = require('../app/db');

// 薬idから薬の情報を取得する。
// 所有者ではないor存在しないmedicineIdの指定の場合はfalseを返す。
async function getMedicine(medicineId, authId) {
    // medicineテーブルのmedicine_id以外を取得
    let sql =
        'SELECT ' +
        'medicine_id as medicineId,' +
        'medicine_name as medicineName,' +
        'hospital_name as hospitalName,' +
        'number,' +
        'DATE_FORMAT(starts_date, "%Y-%m-%d") as startsDate,' +
        'period,' +
        'type_id as medicineType,' +
        'image,' +
        'description,' +
        'group_id as groupId ' +
        'FROM medicine M ' +
        'WHERE M.group_id in (SELECT group_id FROM medicine_group WHERE user_id = ?) ' +
        'AND medicine_id = ?';
    let userId = await app.getUserId(authId);
    let medicineResult = (await connection.query(sql, [userId, medicineId]))[0][0];

    // 存在しないmedice_idの指定、もしくは自分以外が作成した薬情報を指定した時の処理
    if (typeof medicineResult === 'undefined') {
        return false;
    } else {
        // medicine_take_timeテーブルの情報を取得
        let sql =
            'SELECT take_time_id as medicineTakeTime ' +
            'FROM medicine_take_time ' +
            'WHERE medicine_id = ? ' +
            'ORDER BY take_time_id;'
        let takeTimeResult = (await connection.query(sql, [medicineResult['medicineId']]))[0];
        let takeTimeArray = [];
        for (let row of takeTimeResult) {
            takeTimeArray.push(String(row['medicineTakeTime']));
        }

        return [medicineResult, takeTimeArray];
    }
}

module.exports = getMedicine;