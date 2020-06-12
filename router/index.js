const Router = require('koa-router');
const router = new Router();
const app = require('../app/app');

router.get('/', async (ctx) => {
    let session = ctx.session;

    if (session.auth_id === undefined) {
        return await ctx.render('index');
    }

    /*
    let result;
    let authId = session.auth_id;
    let userId = await app.getUserId(authId);
    */

    await ctx.render('medicine-list');
})

module.exports = router;
