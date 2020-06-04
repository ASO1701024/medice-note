const Router = require('koa-router');
const router = new Router();

router.get('/', async (ctx, next) => {
    await ctx.render('index', {
        message: 'Hello, World!'
    });
})

module.exports = router;
