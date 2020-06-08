const connection = require('./db');

const getUserId = async function (authId) {
    let sql = 'SELECT user_id FROM session WHERE session_id = ? AND expired_at >= ?';
    let [auth] = await connection.query(sql, [authId, new Date()]);
    if (auth.length === 0) {
        return false;
    }
    return auth[0].user_id;
}

module.exports = getUserId;