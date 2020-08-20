const cron = require('node-cron');
const connection = require('./db');
const lineLogin = require('line-login');
const config = require('../config.json');
const login = new lineLogin(config.line_login);

module.exports = cron.schedule('0 0 0 1 * *', async () => {
    let getLineLoginListSQL =
        'SELECT SQ.user_id, access_token, refresh_token ' +
        'FROM line_login LL ' +
        'RIGHT JOIN (SELECT user_id FROM user WHERE deleted_at IS NULL)SQ ON LL.user_id = SQ.user_id ';
    let lineLoginList = (await connection.query(getLineLoginListSQL, []))[0];
    for (let row of lineLoginList) {
        await letAccessTokenEnable(row['user_id'], row['access_token'], row['refresh_token']);
    }
});

async function letAccessTokenEnable(userId, accessToken, refreshToken) {
    login.verify_access_token(accessToken).then(async () => {
        // verify_success
    }).catch(async () => {
        // verify_filed
        await refreshAccessToken(refreshToken, userId);
    });
}

async function refreshAccessToken(refreshToken, userId) {
    login.refresh_access_token(refreshToken)
        .then(async (result) => {
            // refresh_success
            let refreshTokenSQL = 'UPDATE line_login SET access_token = ?, refresh_token = ? WHERE user_id = ?';
            await connection.query(refreshTokenSQL, [result['access_token'], result['refresh_token'], userId]);
        })
        .catch(async () => {
            // refresh_failed
            let errorMsg = '機能: refresh_access_token  ステータスコード: 400  エラーメッセージ: Bad Request';
            await insertUserMessage(userId, errorMsg, 3);
        })
}

async function insertUserMessage(userId, resultMessage, resultFlg) {
    let insertErrorSQL = 'INSERT INTO user_message VALUES (0,?,?,?)';
    await connection.query(insertErrorSQL, [userId, resultMessage, resultFlg]);
}