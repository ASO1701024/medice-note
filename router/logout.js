const Router = require('koa-router');
const connection = require('../app/db');
const router = new Router();

router.get('/logout', async (ctx) => {
    let authId = ctx.session.auth_id;
    if (authId !== undefined && authId !== '') {
        let sql = 'DELETE FROM session WHERE session_id = ?';
        await connection.query(sql, [authId]);
    }

    ctx.session = null;

    ctx.redirect('/login');
})

module.exports = router;
