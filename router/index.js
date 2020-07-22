const Router = require('koa-router');
const router = new Router();
const app = require('../app/app');
const connection = require('../app/db');
const parser = require('ua-parser-js');

router.get('/', async (ctx) => {
    let session = ctx.session;
    app.initializeSession(session);

    let result = app.initializeRenderResult();

    let authId = session.auth_id;
    let userId = await app.getUserId(authId);
    result['data']['meta']['login_status'] = Boolean(userId);
    result['data']['meta']['site_title'] = 'トップページ - Medice Note';

    let ua = parser(ctx.request.header['user-agent']);
    if (ua.browser.name === undefined || !['chrome', 'firefox'].includes(ua.browser.name.toLowerCase())) {
        result['data']['meta']['browser_warning'] = true;
    }

    result['data']['meta']['seo']['bool'] = true;
    result['data']['meta']['seo']['description'] = 'お薬手帳をウェブサイトで管理できるサービスです';
    result['data']['meta']['seo']['url'] = 'https://www.medice-note.vxx0.com';

    if (Boolean(userId)) {
        result['data']['meta']['group_list'] = await app.getGroupList(userId);

        let sql = 'SELECT message, message_flg FROM user_message WHERE user_id = ?';
        let [message] = await connection.query(sql, [userId]);
        if (message.length !== 0) {
            result['data']['meta']['message'] = [];
            result['data']['meta']['message']['info'] = [];
            result['data']['meta']['message']['success'] = [];
            result['data']['meta']['message']['fail'] = [];

            for (let i = 0; i < message.length; i++) {
                switch (message[i]['message_flg']) {
                    case 1:
                        result['data']['meta']['message']['info'].push(message[i]['message']);
                        break;
                    case 2:
                        result['data']['meta']['message']['success'].push(message[i]['message']);
                        break;
                    case 3:
                        result['data']['meta']['message']['fail'].push(message[i]['message']);
                        break;
                }
            }
        }

        sql = 'DELETE FROM user_message WHERE user_id = ?';
        await connection.query(sql, [userId]);
    }

    if (session.success !== undefined) {
        result['data']['success'] = session.success;
        session.success = undefined;
    }

    if (session.error !== undefined) {
        result['data']['error'] = session.error;
        session.error = undefined;
    }

    await ctx.render('index', result);
})

module.exports = router;
