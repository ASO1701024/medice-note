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
const crypto = require("crypto");

router.get('/lineLogin', async (ctx, next) => {
    let session = ctx.session;
    app.initializeSession(session);

    let authId = session.auth_id;
    let userId = await app.getUserId(authId);
    if (!userId) {
        session.error = 'ログインしていないため続行できませんでした';
        return ctx.redirect('/login');
    }
    ctx.session.line_login_state = crypto.randomBytes(20).toString('hex');
    ctx.session.line_login_nonce = crypto.randomBytes(20).toString('hex');
    return ctx.redirect(login.make_auth_url(ctx.session.line_login_state, ctx.session.line_login_nonce)+"&scope=profile%20openid");
});

router.get('/lineCallback', login.callback(
    async (ctx, res, next, token_response) => {
        let session = ctx.session;
        app.initializeSession(session);

        let authId = session.auth_id;
        let userId = await app.getUserId(authId);
        if (!userId) {
            session.error = 'ログインしていないため続行できませんでした';
            return ctx.redirect('/login');
        }
        ctx.session.line_login_state = null;
        ctx.session.line_login_nonce = null;

        let accessToken = token_response.access_token;
        let refreshToken = token_response.refresh_token;

        let lineProfile = (await login.get_user_profile(token_response.access_token));
        let lineUserId = lineProfile.userId;
        let lineUserName = lineProfile.displayName;

        let lineLoginSQL = 'SELECT user_id FROM line_login WHERE user_id = ?;';
        let lineUserData = (await connection.query(lineLoginSQL, [userId]))[0];
        if(lineUserData.length > 0){
            // 既にLINEログイン済みのユーザーが再度登録を行なった場合は、登録済みの情報を削除してからINSERTする
            let deleteLineLoginSQL = 'DELETE FROM line_login WHERE user_id = ?;';
            await connection.query(deleteLineLoginSQL, [userId]);
            let deleteLineNoticeUserId = 'DELETE FROM line_notice_user_id WHERE user_id = ?;';
            await connection.query(deleteLineNoticeUserId, [userId]);
        }

        let insertLineLoginSQL = 'INSERT INTO line_login VALUES(?,?,?,?);';
        await connection.query(insertLineLoginSQL, [userId, lineUserName, accessToken, refreshToken]);
        let insertLineUserIdSQL = 'INSERT INTO line_notice_user_id VALUES(?,?);';
        await connection.query(insertLineUserIdSQL, [userId, lineUserId]);
    },
    (ctx, res, next, error) => {
        console.log(error);
    }
));

module.exports = router;