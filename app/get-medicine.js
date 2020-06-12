const app = require('../app/app');
const connection = require('../app/db');

// 薬idから薬の情報を取得する。
// 所有者ではないor存在しないmedicineIdの指定の場合はfalseを返す。
async function getMedicine(medicineId, authId) {
    // medicineテーブルのmedicine_id以外を取得
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
    let userId = await app.getUserId(authId);
    let medicineResult = (await connection.query(sql, [userId, medicineId]))[0][0];

    // 存在しないmedice_idの指定、もしくは自分以外が作成した薬情報を指定した時の処理
    if (typeof medicineResult === 'undefined') {
        return false;
    } else {
        return medicineResult;
    }
}

module.exports = getMedicine;