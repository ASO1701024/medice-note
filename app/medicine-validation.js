const validator = require('validatorjs');
const connection = require('../app/db');
const app = require('../app/app');

// 受け取った薬情報を検証する。
// 登録時と変更時に検証を行うため、外部ファイルから利用。
async function validation(items,authId) {
    // データをvalidationするために整形
    let requests = {
        medicineName: String(items[0]),
        hospitalName: items[1],
        number: items[2],
        startsDate: items[3],
        period: items[4],
        medicineType: items[5],
        image: items[6],
        description: items[7],
        groupId: items[8]
    };
    // 存在するmedicineTypeIdを取得。
    let sql = 'SELECT type_id FROM medicine_type;';
    let typeListResult = (await connection.query(sql))[0];
    let typeList = [];
    for(let row of typeListResult){
        typeList.push(String(row['type_id']));
    }
    // 更新権限を持つgroup_idを取得
    let userId = await app.getUserId(authId);
    sql = 'SELECT group_id FROM medicine_group WHERE user_id = ?;';
    let groupListResult = (await connection.query(sql,[userId]))[0]
    let groupList = [];
    for(let row of groupListResult){
        groupList.push(String(row['group_id']));
    }
    // validationのルール
    let rules = {
        medicineName: 'required|max:250',
        hospitalName: 'required|max:100',
        number: 'required|numeric|max:100',
        startsDate: 'required|date', //
        period: 'required|numeric|min:0|max:1000',
        medicineType: ['required', 'numeric', {'in': typeList}],
        image: 'max:100',
        description: 'max:255',
        groupId: ['numeric', {'in': groupList}],
    };
    // エラーメッセージ
    let errorMessage = {
        'required.medicineName': "薬の名前は必須項目です",
        'required.hospitalName': "病院名は必須項目です",
        'required.number': "個数は必須項目です",
        'required.startsDate': "処方日は必須項目です",
        'required.period': "何日分は必須項目です",
        'required.medicineType': "種類は必須項目です",
        'numeric.number': "個数は数字で入力して下さい",
        'numeric.period': "何日分は数字で入力して下さい",
        'numeric.medicineType': "種類は選択肢から選んで下さい",
        'numeric.groupId': "グループは選択肢から選んで下さい",
        'max.medicineName': "薬の名前は250文字以内で入力して下さい",
        'max.hospitalName': "病院名は100文字以下で入力して下さい",
        'max.number': "飲む個数は100個以下を入力して下さい",
        'max.period': "飲む期間は1000日以下を入力して下さい",
        'max.description': "説明は250文字以下で入力して下さい",
        'min.startsDate': "処方日は日付の形式で入力して下さい",
        'min.period': "何日分は1以上の数字を入力して下さい",
        'in.medicineType': "種類はリストから選択して下さい",
        'in.groupId': "グループはリストから選択して下さい",
        'date.startsDate': "処方日はリストから選択して下さい",
    }
    // validation実行
    let requestValidate = new validator(requests, rules, errorMessage);

    // validationの結果を取り出してresultに代入
    let result = {errors: {}, is_success: false, request: {}};
    await requestValidate.checkAsync(() => {
        // 検証成功時処理
        result.is_success = true;
    }, () => {
        // 検証拒否時処理
        result.is_success = false;
        result.errors.medicineName = requestValidate.errors.first('medicineName');
        result.errors.hospitalName = requestValidate.errors.first('hospitalName');
        result.errors.number = requestValidate.errors.first('number');
        result.errors.startsDate = requestValidate.errors.first('startsDate');
        result.errors.period = requestValidate.errors.first('period');
        result.errors.medicineType = requestValidate.errors.first('medicineType');
        result.errors.image = requestValidate.errors.first('image')
        result.errors.description = requestValidate.errors.first('description');
        result.errors.groupId = requestValidate.errors.first('groupId');
        result.request = requests;
    })

    return result;
}

module.exports = validation;