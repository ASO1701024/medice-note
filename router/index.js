const Router = require('koa-router');
const router = new Router();
const app = require('../app/app');
const connection = require('../app/db');
const parser = require('ua-parser-js');

router.get('/', async (ctx) => {
    let session = ctx.session;
    app.initializeSession(session);

    let authId = session.auth_id;
    let userId = await app.getUserId(authId);

    let result = app.initializeRenderResult();

    let ua = parser(ctx.request.header['user-agent']);
    if (ua.browser.name === undefined || !['chrome', 'firefox'].includes(ua.browser.name.toLowerCase())) {
        result['data']['meta']['browser_warning'] = true;
    }

    if (Boolean(userId)) {
        result['data']['meta']['group_list'] = await app.getGroupList(userId);

        let sql = 'SELECT message, message_flg FROM user_message WHERE user_id = ?';
        let [message] = await connection.query(sql, [userId]);
        if (message.length !== 0) {
            result['data']['meta']['message'] = [];
            result['data']['meta']['message']['info'] = [];
            result['data']['meta']['message']['success'] = [];
            result['data']['meta']['message']['fail'] = [];

            for (let i = 0; i < message.length; i++) {
                switch (message[i]['message_flg']) {
                    case 1:
                        result['data']['meta']['message']['info'].push(message[i]['message']);
                        break;
                    case 2:
                        result['data']['meta']['message']['success'].push(message[i]['message']);
                        break;
                    case 3:
                        result['data']['meta']['message']['fail'].push(message[i]['message']);
                        break;
                }
            }
        }

        sql = 'DELETE FROM user_message WHERE user_id = ?';
        await connection.query(sql, [userId]);

        result['data']['meta']['login_status'] = true;
        result['data']['meta']['site_title'] = '薬情報一覧 - Medice Note';
        result['data']['meta']['group_list'] = await app.getGroupList(userId);
        result['data']['meta']['script'] = [
            '/stisla/modules/sweetalert/sweetalert.min.js',
            '/js/medicine-delete-alert.js',
            '/js/library/notyf.min.js'
        ];
        result['data']['meta']['script_delay'] = [
            '/js/medicine-list.js'
        ];
        result['data']['meta']['css'] = [
            '/css/library/notyf.min.css'
        ];

        sql = `
            SELECT medicine_id, medicine_name, hospital_name, number, date_format(starts_date, '%Y年%c月%d日') as starts_date, period,
                   medicine_type.type_name, image, description, medicine.group_id, medicine_group.group_name
            FROM medicine
            LEFT JOIN medicine_type ON medicine.type_id = medicine_type.type_id
            LEFT JOIN medicine_group ON medicine.group_id = medicine_group.group_id
            WHERE medicine.group_id in (SELECT group_id FROM medicine_group WHERE user_id = ?)
            ORDER BY starts_date`;

        let [data] = await connection.query(sql, [userId]);

        for (let i = 0; i < data.length; i++) {
            let medicineId = data[i]['medicine_id'];
            sql = `
                SELECT take_time_name FROM medicine_take_time
                LEFT JOIN take_time ON medicine_take_time.take_time_id = take_time.take_time_id
                WHERE medicine_id = ?`;
            let [takeTime] = await connection.query(sql, [medicineId]);
            let takeTimeArray = [];
            for (let j = 0; j < takeTime.length; j++) {
                takeTimeArray.push(takeTime[j]['take_time_name']);
            }
            data[i]['take_time'] = takeTimeArray.join(' ・ ');
        }

        let dayArray = [];
        for (let i = 0; i < data.length; i++) {
            if (!Array.isArray(dayArray[data[i]['starts_date']])) {
                dayArray[data[i]['starts_date']] = [];
            }
            dayArray[data[i]['starts_date']].push(data[i]);
        }
        result['data']['medicine_list'] = dayArray;

        if (session.success !== undefined) {
            result['data']['success'] = session.success;
            session.success = undefined;
        }

        if (session.error !== undefined) {
            result['data']['error'] = session.error;
            session.error = undefined;
        }

        await ctx.render('medicine-list', result);
    } else {
        result['data']['meta']['login_status'] = false;
        result['data']['meta']['site_title'] = 'トップページ - Medice Note';
        result['data']['meta']['seo']['bool'] = true;
        result['data']['meta']['seo']['description'] = 'お薬手帳をウェブサイトで管理できるサービスです';
        result['data']['meta']['seo']['url'] = 'https://www.medice-note.vxx0.com';

        if (session.success !== undefined) {
            result['data']['success'] = session.success;
            session.success = undefined;
        }

        if (session.error !== undefined) {
            result['data']['error'] = session.error;
            session.error = undefined;
        }

        await ctx.render('index', result);
    }
})

module.exports = router;
