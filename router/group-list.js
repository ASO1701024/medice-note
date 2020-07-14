const Router = require('koa-router');
const router = new Router();
const validator = require('validatorjs');
const app = require('../app/app');
const connection = require('../app/db');

router.get('/group-list', async (ctx) => {
    let session = ctx.session;
    app.initializeSession(session);

    let result = app.initializeRenderResult();

    let authId = session.auth_id;
    let userId = await app.getUserId(authId);
    if (!userId) {
        session.error.message = 'ログインしていないため続行できませんでした';

        return ctx.redirect('/login');
    }

    let sql = 'SELECT group_id, group_name FROM medicine_group WHERE user_id = ? AND is_deletable = false';
    let [group] = await connection.query(sql, [userId]);

    result['data']['group_list'] = group;

    result['data']['meta']['login_status'] = true;
    result['data']['meta']['site_title'] = 'グループ情報 - Medice Note';
    result['data']['meta']['group_list'] = await app.getGroupList(userId);

    if (session.success !== undefined) {
        result['data']['success'] = session.success;
        session.success = undefined;
    }

    if (session.error !== undefined) {
        result['data']['error'] = session.error;
        session.error = undefined;
    }

    await ctx.render('group-list', result);
})

router.post('/group-list/add', async (ctx) => {
    let session = ctx.session;
    app.initializeSession(session);

    let authId = session.auth_id;
    let userId = await app.getUserId(authId);
    if (!userId) {
        session.error.message = 'ログインしていないため続行できませんでした';

        return ctx.redirect('/login');
    }

    let groupName = ctx.request.body['group_name'];
    let groupNameValidation = new validator({
        groupName: groupName
    }, {
        groupName: 'required|string|min:1|max:100'
    });
    if (groupNameValidation.fails()) {
        session.error.message = 'グループ名を1文字以上100文字以下で入力してください';

        return ctx.redirect('/group-list');
    }

    let sql = 'INSERT INTO medicine_group (group_name, user_id) VALUES (?, ?)';
    await connection.query(sql, [groupName, userId]);

    session.success.message = 'グループ情報を登録しました';
    ctx.redirect('/group-list');
})

router.post('/group-list/edit', async (ctx) => {
    let session = ctx.session;
    app.initializeSession(session);

    let authId = session.auth_id;
    let userId = await app.getUserId(authId);
    if (!userId) {
        session.error.message = 'ログインしていないため続行できませんでした';

        return ctx.redirect('/login');
    }

    let groupId = ctx.request.body['group_id'];
    let groupName = ctx.request.body['group_name'];
    let groupNameValidation = new validator({
        groupName: groupName
    }, {
        groupName: 'required|string|min:1|max:100'
    });
    if (groupNameValidation.fails()) {
        session.error.message = 'グループ名を1文字以上100文字以下で入力してください';

        return ctx.redirect('/group-list');
    }

    let sql = 'SELECT group_id FROM medicine_group WHERE group_id = ? AND user_id = ?';
    let [group] = await connection.query(sql, [groupId, userId]);
    if (group.length === 0) {
        session.error.message = 'グループ情報が見つかりませんでした';

        return ctx.redirect('/group-list');
    }

    sql = 'UPDATE medicine_group SET group_name = ? WHERE group_id = ?';
    await connection.query(sql, [groupName, groupId]);

    session.success.message = 'グループ情報を更新しました';
    ctx.redirect('/group-list');
})

router.post('/group-list/delete', async (ctx) => {
    let session = ctx.session;
    app.initializeSession(session);

    let authId = session.auth_id;
    let userId = await app.getUserId(authId);
    if (!userId) {
        session.error.message = 'ログインしていないため続行できませんでした';

        return ctx.redirect('/login');
    }

    let groupId = ctx.request.body['group_id'];

    let sql = 'SELECT group_id FROM medicine_group WHERE group_id = ? AND user_id = ?';
    let [group] = await connection.query(sql, [groupId, userId]);
    if (group.length === 0) {
        session.error.message = 'グループ情報が見つかりませんでした';

        return ctx.redirect('/group-list');
    }

    let defaultGroupId = await app.getDefaultGroup(userId);
    sql = 'UPDATE medicine SET group_id = ? WHERE group_id = ?';
    await connection.query(sql, [defaultGroupId, groupId]);

    sql = 'DELETE FROM medicine_group WHERE group_id = ?';
    await connection.query(sql, [groupId]);

    session.success.message = 'グループ情報を削除しました';
    ctx.redirect('/group-list');
})

module.exports = router;
