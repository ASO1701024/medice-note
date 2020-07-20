const Router = require('koa-router');
const router = new Router();
const app = require('../app/app');
const connection = require('../app/db');
const lineLogin = require("line-login");
const config = require('../config.json');
const login = new lineLogin(config.line_login);

router.get('/account-setting', async (ctx) => {
    let session = ctx.session;
    app.initializeSession(session);

    let authId = session.auth_id;
    let userId = await app.getUserId(authId);
    if (!authId || !userId) {
        session.error.message = 'ログインしていないため続行できませんでした';
        return ctx.redirect('/');
    }

    let result = app.initializeRenderResult();
    result['data']['meta']['login_status'] = true;
    result['data']['meta']['site_title'] = 'アカウント設定 - Medice Note';
    result['data']['meta']['group_list'] = await app.getGroupList(userId);

    let sql = 'SELECT user_name, mail FROM user WHERE user_id = ?';
    let [user] = await connection.query(sql, [userId]);
    result['data']['account'] = {};
    result['data']['account']['user_name'] = user[0]['user_name'];
    result['data']['account']['mail'] = user[0]['mail'];

    let lineLoginSQL = 'SELECT line_user_name, access_token, refresh_token FROM line_login WHERE user_id = ?';
    let lineUserData = (await connection.query(lineLoginSQL, [userId]))[0];

    if (lineUserData.length > 0) {
        // verify access_token
        let lineUserName = lineUserData[0].line_user_name;
        let lineAccessToken = lineUserData[0].access_token;
        let lineRefreshToken = lineUserData[0].refresh_token;

        if (await letAccessTokenEnable(userId, lineAccessToken, lineRefreshToken)) {
            result['data']['account']['line_user_name'] = lineUserName;
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

    let getAccessTokenSQL = 'SELECT access_token from line_login WHERE user_id = ?';
    let accessToken = (await connection.query(getAccessTokenSQL, [userId]))[0];

    if (accessToken.length === 0) {
        // When you have't logged in line
        session.error.message = 'アカウント連携されていません'
        return ctx.redirect('/account-setting');
    }

    await login.revoke_access_token(accessToken[0].access_token);

    let deleteLineLoginSQL = 'DELETE FROM line_login WHERE user_id = ?';
    await connection.query(deleteLineLoginSQL, [userId]);
    let deleteLineNoticeUserId = 'DELETE FROM line_notice_user_id WHERE user_id = ?';
    await connection.query(deleteLineNoticeUserId, [userId]);

    return ctx.redirect('/account-setting');
});

async function letAccessTokenEnable(userId, accessToken, refreshToken) {
    return login.verify_access_token(accessToken).then(() => {
        // verify_success
        return accessToken;
    }).catch(async () => {
        let refreshTokenResult = await refreshAccessToken(refreshToken, userId);
        if (refreshTokenResult) {
            return refreshTokenResult;
        }
        return false;
    });
}

async function refreshAccessToken(refreshToken, userId) {
    // verify_failed
    return login.refresh_access_token(refreshToken)
        .then(async (result) => {
            let refreshTokenSQL = 'UPDATE line_login SET access_token = ?, refresh_token = ? WHERE user_id = ?';
            await connection.query(refreshTokenSQL, [result['access_token'], result['refresh_token'], userId]);
            return result['access_token'];
        })
        .catch(async () => {
            let deleteLoginDataSQL = 'DELETE FROM line_login WHERE user_id = ?';
            await connection.query(deleteLoginDataSQL, [userId]);
            let deleteLineNoticeUserId = 'DELETE FROM line_notice_user_id WHERE user_id = ?';
            await connection.query(deleteLineNoticeUserId, [userId]);
            return false;
        })
}

module.exports = router;