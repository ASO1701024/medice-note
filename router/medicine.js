const Router = require('koa-router');
const router = new Router();
const getMedicine = require('../app/get-medicine');

router.get('/medicine/:medicine_id', async (ctx) => {
    let session = ctx.session;
    if (!session.auth_id) {
        return ctx.redirect('/login');
    }
    let medicineId = ctx.params['medicine_id'];

    let medicineData = (await getMedicine(medicineId, session.auth_id));

    if (medicineData === false) {
        return ctx.redirect('/medicine-register');
    }

    let result = {};
    result['data'] = {};
    result['data']['medicineData'] = medicineData;
    await ctx.render('/medicine', result);
})

module.exports = router;