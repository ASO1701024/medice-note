const Router = require('koa-router');
const router = new Router();
const validator = require('validatorjs');
const app = require('../app/app');
const connection = require('../app/db')

router.get('/api/ocr', async (ctx) => {
    let session = ctx.session;

    let authKey = session.auth_id;
    let userId = await app.getUserId(authKey);
    if (!userId) {
        return ctx.body = {};
    }


})

module.exports = router;
