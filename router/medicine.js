const Router = require('koa-router');
const router = new Router();
const app = require('../app/app');

router.get('/medicine/:medicine_id', async (ctx) => {
    let session = ctx.session;
    let userId = await app.getUserId(session.auth_id);

    if (!session.auth_id) {
        return ctx.redirect('/login');
    }
    let medicineId = ctx.params['medicine_id'];

    let medicineData = (await app.getMedicine(medicineId, userId));

    if (medicineData === false) {
        return ctx.redirect('/medicine-register');
    }

    let result = {};
    result['data'] = {};
    result['data']['medicineData'] = medicineData;
    await ctx.render('/medicine', result);
})

module.exports = router;