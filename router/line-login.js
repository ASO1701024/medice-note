const Router = require('koa-router');
const router = new Router();
const app = require('../app/app');
const connection = require('../app/db');
const lineLogin = require('line-login');
const config = require('../config.json');
const login = new lineLogin(config.line_login);
const crypto = require('crypto');

router.get('/account-setting/line-login', async (ctx) => {
    let session = ctx.session;
    app.initializeSession(session);

    let authId = session.auth_id;
    let userId = await app.getUserId(authId);
    if (!userId) {
        session.error.message = 'ログインしていないため続行できませんでした';
        return ctx.redirect('/login');
    }
    ctx.session.line_login_state = crypto.randomBytes(20).toString('hex');
    ctx.session.line_login_nonce = crypto.randomBytes(20).toString('hex');
    return ctx.redirect(login.make_auth_url(ctx.session.line_login_state, ctx.session.line_login_nonce) + '&scope=profile%20openid');
});

router.get('/account-setting/line-callback', async (ctx) => {
    let session = ctx.session;
    app.initializeSession(session);

    let authId = session.auth_id;
    let userId = await app.getUserId(authId);
    if (!userId) {
        session.error.message = 'ログインしていないため続行できませんでした';
        return ctx.redirect('/login');
    }
    delete ctx.session.line_login_state;
    delete ctx.session.line_login_nonce;

    // Get access_token from 'code'
    await login.issue_access_token(ctx.request.query.code).then(async (token_response) => {
        let accessToken = token_response.access_token;
        let refreshToken = token_response.refresh_token;

        // Get line Profile from access_token
        let lineProfile = (await login.get_user_profile(accessToken));
        let lineUserId = lineProfile.userId;
        let lineUserName = lineProfile.displayName;

        // Check your line_data already exists in the database
        let lineLoginSQL = 'SELECT user_id FROM line_login WHERE user_id = ?;';
        let lineUserData = (await connection.query(lineLoginSQL, [userId]))[0];
        if (lineUserData.length > 0) {
            // When already exists
            let deleteLineLoginSQL = 'DELETE FROM line_login WHERE user_id = ?;';
            await connection.query(deleteLineLoginSQL, [userId]);
            let deleteLineNoticeUserId = 'DELETE FROM line_notice_user_id WHERE user_id = ?;';
            await connection.query(deleteLineNoticeUserId, [userId]);
        }

        // Register line_data
        let insertLineLoginSQL = 'INSERT INTO line_login VALUES(?,?,?,?);';
        await connection.query(insertLineLoginSQL, [userId, lineUserName, accessToken, refreshToken]);
        let insertLineUserIdSQL = 'INSERT INTO line_notice_user_id VALUES(?,?);';
        await connection.query(insertLineUserIdSQL, [userId, lineUserId]);
    })

    return ctx.redirect('/account-setting')
});

module.exports = router;