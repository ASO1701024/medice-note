const Router = require('koa-router');
const router = new Router();
// const mysql = require('mysql');
// const connection = require('../db');

router.get('/logout', async (ctx, next) => {
    ctx.session = null;

    ctx.redirect('/login');
})

module.exports = router;
