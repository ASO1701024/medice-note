const connection = require('./db');

module.exports = {
    getUserId: async (authId) => {
        let sql = 'SELECT user_id FROM session WHERE session_id = ? AND expired_at >= ?';
        let [auth] = await connection.query(sql, [authId, new Date()]);
        if (auth.length === 0) {
            return false;
        }
        return auth[0].user_id;
    },
    getMedicineAll: async (userId) => {
        let sql =
            'SELECT medicine_id, medicine_name, number, period, image ' +
            'FROM medicine M LEFT JOIN medicine_group MG ON M.group_id = MG.group_id ' +
            'WHERE MG.user_id = ?;';
        let medicineData = await connection.query(sql, [userId]);
        if (medicineData.length === 0) {
            return false;
        }
        return medicineData[0];
    },
}
