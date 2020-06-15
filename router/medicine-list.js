const Router = require('koa-router');
const router = new Router();
const app = require('../app/app');
const connection = require('../app/db');

router.get('/medicine-list', async (ctx) => {
    let session = ctx.session;
    if (!session.auth_id) {
        return ctx.redirect('/login');
    }

    let userId = await app.getUserId(session.auth_id);
    let medicineDataList = await app.getMedicineAll(userId);

    let result = {};
    result['data'] = {};
    result['data']['medicineList'] = [];
    for (let row of medicineDataList) {
        result['data']['medicineList'].push(row);
    }

    await ctx.render('/medicine-list', result);
})

module.exports = router;