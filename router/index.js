const Router = require('koa-router');
const router = new Router();
const getUserId = require('../app/app');

router.get('/', async (ctx, next) => {
    let session = ctx.session;

    let result;
    if (session.auth_id === undefined) {
        result = '未ログイン';
    } else {
        result = 'ログイン済み\n' + session.auth_id;
    }

    console.log(await getUserId(session.auth_id));

    await ctx.render('index', {
        message: result
    });
})

module.exports = router;
