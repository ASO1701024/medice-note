const Router = require('koa-router');
const router = new Router();
const connection = require('../db');

router.get('/login', async (ctx, next) => {
    await ctx.render('login');
})

router.post('/login', async (ctx, next) => {
    console.log(ctx.request.body);

    let userId = ctx.request.body.user_id;
    let password = ctx.request.body.password;

    connection.query('SELECT * FROM user WHERE user_id = ?', [userId], function (error, result, field) {
        if (result.length === 0) {
            console.log('User Not Found');
        }
        for (let i = 0; i < result.length; i++) {
            let test = result[i].password;
            console.log(test);
        }
    });

    ctx.redirect('/login')
})

module.exports = router;
