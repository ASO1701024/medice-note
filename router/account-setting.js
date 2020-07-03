const Router = require('koa-router');
const router = new Router();
const app = require('../app/app');
const connection = require('../app/db');
const lineLogin = require("line-login");
const lineConfig = require('../config.sample.json');
const login = new lineLogin({
    channel_id: lineConfig.line.LINE_LOGIN_CHANNEL_ID,
    channel_secret: lineConfig.line.LINE_LOGIN_CHANNEL_SECRET,
    callback_url: lineConfig.line.LINE_LOGIN_CALLBACK_URL,
});

router.get('/account-setting', async (ctx, next) => {
    let session = ctx.session;
    app.initializeSession(session);

    let authId = session.auth_id;
    let userId = await app.getUserId(authId);
    if (!authId || !userId) {
        session.error = 'ログインしていないため続行できませんでした';
        return ctx.redirect('/');
    }

    let result = app.initializeRenderResult();
    result['data']['meta']['login_status'] = true;
    result['data']['meta']['site_title'] = 'アカウント設定 - Medice Note';

    let sql = 'SELECT user_name, mail FROM user WHERE user_id = ?';
    let [user] = await connection.query(sql, [userId]);
    result['data']['account'] = {};
    result['data']['account']['user_name'] = user[0]['user_name'];
    result['data']['account']['mail'] = user[0]['mail'];

    let lineLoginSQL = 'SELECT line_user_name, access_token, refresh_token FROM line_login WHERE user_id = ?;';
    let lineUserData = (await connection.query(lineLoginSQL, [userId]))[0];

    if (lineUserData.length > 0) {
        // verify access_token
        let lineUserName = lineUserData[0].line_user_name;
        let lineAccessToken = lineUserData[0].access_token;
        let lineRefreshToken = lineUserData[0].refresh_token;

        let verifyAccessTokenResult = await login.verify_access_token(lineAccessToken);

        if (typeof verifyAccessTokenResult.error === 'undefined') {
            // verify_success
            result['data']['account']['line_user_name'] = lineUserName;

        } else {
            // refresh_access_token
            let refreshAccessTokenResult = login.refresh_access_token(lineRefreshToken);

            if (typeof refreshAccessTokenResult.error === 'undefined') {
                // UPDATE 'access_token' and 'refresh_token'
                let newAccessToken = refreshAccessTokenResult.access_token;
                let newRefreshToken = refreshAccessTokenResult.refresh_token;
                let refreshTokenSQL = 'UPDATE line_login SET access_token = ?, refresh_token = ? WHERE user_id=?;';

                await connection.query(refreshTokenSQL, [newAccessToken, newRefreshToken, userId])
                result['data']['account']['line_user_name'] = lineUserName[0]['line_user_name'];

            } else {
                // DELETE "line_login" and "line_notice_user_id"
                let deleteLineLoginSQL = 'DELETE FROM line_login WHERE user_id = ?;';
                await connection.query(deleteLineLoginSQL, [userId]);
                let deleteLineNoticeUserId = 'DELETE FROM line_notice_user_id WHERE user_id = ?;';
                await connection.query(deleteLineNoticeUserId, [userId]);
            }
        }
    }

    await ctx.render('account-setting', result);
});

router.get('/account-setting/line-logout', async (ctx) => {
    let session = ctx.session;
    app.initializeSession(session);

    let authId = session.auth_id;
    let userId = await app.getUserId(authId);
    if (!authId || !userId) {
        session.error = 'ログインしていないため続行できませんでした';
        return ctx.redirect('/');
    }

    let getAccessTokenSQL = 'SELECT access_token from line_login WHERE user_id = ?;';
    let accessToken = (await connection.query(getAccessTokenSQL, [userId]))[0];

    if(accessToken.length === 0){
        // When you have't logged in line
        return ctx.redirect('/account-setting');
    }

    await login.revoke_access_token(accessToken[0].access_token);

    let deleteLineLoginSQL = 'DELETE FROM line_login WHERE user_id = ?;';
    await connection.query(deleteLineLoginSQL, [userId]);
    let deleteLineNoticeUserId = 'DELETE FROM line_notice_user_id WHERE user_id = ?;';
    await connection.query(deleteLineNoticeUserId, [userId]);

    return ctx.redirect('/account-setting');
});

module.exports = router;