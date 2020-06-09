const Router = require('koa-router');
const router = new Router();
const app = require('../app/app');

router.get('/', async (ctx) => {
    let session = ctx.session;

    let result;
    if (session.auth_id === undefined) {
        result = '未ログイン';
    } else {
        result = 'ログイン済み\n' + session.auth_id;
    }

    console.log(session.auth_id);
    let userId = await app.getUserId(session.auth_id);
    console.log(userId);

    await ctx.render('index', {
        message: result
    });
})

module.exports = router;
