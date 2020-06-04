const Router = require('koa-router');
const router = new Router();

router.get('/', async (ctx, next) => {
    console.log(ctx.session);

    if (ctx.session.test) {
        console.log(ctx.session.test);
    } else {
        ctx.session.test = new Date().toLocaleString();
        console.log(ctx.session.test);
    }

    await ctx.render('index', {
        message: 'Hello, World!'
    });
})

module.exports = router;
