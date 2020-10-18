const cron = require('node-cron');
const connection = require('./db');
const fs = require('fs');
const path = require('path');

module.exports = cron.schedule('0 0 0 * * *', async () => {
    let sql = `
        SELECT user_id FROM user
        WHERE deleted_at IS NOT NULL
        AND CURRENT_DATE() > DATE_ADD(deleted_at, INTERVAL 30 DAY)`;
    let [users] = await connection.query(sql);

    for (let i = 0; i < users.length; i++) {
        let user = users[i];
        let userId = user['user_id'];

        sql = 'DELETE FROM line_login WHERE user_id = ?';
        await connection.query(sql, [userId]);

        sql = 'DELETE FROM line_notice_user_id WHERE user_id = ?';
        await connection.query(sql, [userId]);

        sql = 'DELETE FROM user_authentication_key WHERE user_id = ?';
        await connection.query(sql, [userId]);

        sql = 'DELETE FROM user_reset_password_key WHERE user_id = ?';
        await connection.query(sql, [userId]);

        sql = 'DELETE FROM user_two_factor_authentication WHERE user_id = ?';
        await connection.query(sql, [userId]);

        sql = 'DELETE FROM user_message WHERE user_id = ?';
        await connection.query(sql, [userId]);

        sql = 'DELETE FROM session WHERE user_id = ?';
        await connection.query(sql, [userId]);

        sql = 'DELETE FROM notice_day WHERE notice_id IN (SELECT notice_id FROM notice WHERE user_id = ?)';
        await connection.query(sql, [userId]);

        sql = 'DELETE FROM notice_medicine WHERE notice_id IN (SELECT notice_id FROM notice WHERE user_id = ?)';
        await connection.query(sql, [userId]);

        sql = 'DELETE FROM notice_time WHERE notice_id IN (SELECT notice_id FROM notice WHERE user_id = ?)';
        await connection.query(sql, [userId]);

        sql = 'DELETE FROM notice WHERE user_id = ?';
        await connection.query(sql, [userId]);

        sql = `
            DELETE FROM medicine_take_time
            WHERE medicine_id IN (SELECT medicine_id FROM medicine WHERE group_id IN (SELECT group_id FROM medicine_group WHERE user_id = ?))`;
        await connection.query(sql, [userId]);

        sql = `
            SELECT image FROM medicine
            WHERE group_id IN (SELECT group_id FROM medicine_group WHERE user_id = ?)
            AND image != ''`;
        let [image] = await connection.query(sql, [userId]);
        let deleteImage = [];
        for (let key in image) {
            if (image.hasOwnProperty(key)) {
                deleteImage.push(image[key]['image']);
            }
        }
        deleteImage.forEach(value => {
            fs.unlinkSync(path.join(__dirname, '../public/upload/', value));
        });

        sql = 'DELETE FROM medicine WHERE group_id IN (SELECT group_id FROM medicine_group WHERE user_id = ?)';
        await connection.query(sql, [userId]);

        sql = 'DELETE FROM medicine_group WHERE user_id = ?';
        await connection.query(sql, [userId]);

        sql = 'DELETE FROM user WHERE user_id = ?';
        await connection.query(sql, [userId]);
    }
});
