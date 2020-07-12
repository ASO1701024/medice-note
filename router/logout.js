const Router = require('koa-router');
const router = new Router();

router.get('/logout', async (ctx) => {
    ctx.session = null;

    ctx.redirect('/login');
})

module.exports = router;
