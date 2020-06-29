const Router = require('koa-router');
const router = new Router();
const app = require('../app/app');
const connection = require('../app/db');

router.get('/medicine-list', async (ctx) => {
    let session = ctx.session;
    app.initializeSession(session);

    let viewStyle = 'table'
    if (ctx.request.query['style'] !== undefined) {
        switch (ctx.request.query['style']) {
            case 'table':
            case 'thumbnail':
                viewStyle = ctx.request.query['style'];
        }
    }

    let result = app.initializeRenderResult();

    let authId = session.auth_id;
    let userId = await app.getUserId(authId);
    if (!authId || !userId) {
        return ctx.redirect('/login');
    }

    result['data']['meta']['login_status'] = true;
    result['data']['meta']['site_title'] = '薬情報一覧 - Medice Note';
    result['data']['meta']['script'] = [
        '/stisla/modules/sweetalert/sweetalert.min.js',
        '/js/medicine-delete-alert.js',
        '/js/library/tablesort.min.js',
        '/js/library/tablesort.date.min.js',
        '/js/medicine-list-sort.js'
    ];
    result['data']['meta']['css'] = [
        '/css/library/tablesort.css'
    ];

    let sql = 'SELECT medicine_id, medicine_name, hospital_name, number, ' +
        'date_format(starts_date, \'%Y年%c月%d日\') as starts_date, period, ' +
        'medicine_type.type_name, image, description, group_id FROM medicine ' +
        'LEFT JOIN medicine_type ON medicine.type_id = medicine_type.type_id ' +
        'WHERE group_id in (SELECT group_id FROM medicine_group WHERE user_id = ?)'

    let [data] = await connection.query(sql, [userId]);

    if (viewStyle === 'thumbnail') {
        let allCount = data.length;
        let splitCount = 4;
        let temp = [];

        for(let i = 0; i < Math.ceil(allCount / splitCount); i++) {
            let startCount = i * splitCount;
            let p = data.slice(startCount, startCount + splitCount);
            temp.push(p);
        }
        data = temp;
    }

    result['data']['meta']['view_style'] = viewStyle;
    result['data']['medicine_list'] = data;

    if (session.success !== undefined) {
        result['data']['success'] = session.success;
        session.success.message = undefined;
    }

    if (session.error !== undefined) {
        result['data']['error'] = session.error;
        session.error = undefined;
    }

    await ctx.render('medicine-list', result);
})

module.exports = router;
