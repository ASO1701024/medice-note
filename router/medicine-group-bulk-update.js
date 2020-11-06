const Router = require('koa-router');
const router = new Router();
const connection = require('../app/db');
const app = require('../app/app');

router.post('/group-bulk-update', async (ctx) => {
    const session = ctx.session;
    const authId = session.auth_id;
    const userId = await app.getUserId(authId);

    const groupId = ctx.request.body['group_id'];
    const medicineIdList = ctx.request.body['medicine_id_list'];
    for (let medicineId of medicineIdList) {
        // 指定した変更後グループと変更する薬が、所有者が登録している情報であることを確認
        if (!await app.isHaveMedicine(medicineId, groupId) || !await app.validationGroupId(groupId, userId)) {
            // 一つでも不正な情報を受け取っている場合はfalseを返す
            return ctx.body = {
                result: 'false'
            }
        }
    }
    for (let medicineId of medicineIdList) {
        const updateGroupIdSQL = "UPDATE medicine SET group_id = ? WHERE medicine_id = ?";
        await connection.query(updateGroupIdSQL, [groupId, medicineId])
    }
    return ctx.body = {
        result: 'success'
    }
});

module.exports = router;