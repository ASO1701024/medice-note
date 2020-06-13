async function validationTakeTime(items) {
    const validator = require('validatorjs');
    let requests = {
        array: items,
        medicine1: items[0],
        medicine2: items[1],
        medicine3: items[2],
        medicine4: items[3],
        medicine5: items[4],
        medicine6: items[5],
        medicine7: items[6],
        medicine8: items[7],
        medicine9: items[8],
    };
    //validationのルール
    let rules = {
        array: 'required',
        medicine1: ['numeric', {'in': ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9']}],
        medicine2: ['numeric', {'in': ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9']}],
        medicine3: ['numeric', {'in': ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9']}],
        medicine4: ['numeric', {'in': ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9']}],
        medicine5: ['numeric', {'in': ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9']}],
        medicine6: ['numeric', {'in': ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9']}],
        medicine7: ['numeric', {'in': ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9']}],
        medicine8: ['numeric', {'in': ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9']}],
        medicine9: ['numeric', {'in': ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9']}],
    };
    //エラーメッセージ
    let errorMessage = {
        'required': "飲む時間は必須項目です",
        'numeric': "飲む時間はチェックボックスから選択して下さい",
        'in': "飲む時間はチェックボックスから選択して下さい",
    }
    //validation実行
    let requestValidate = new validator(requests, rules, errorMessage);

    //validationの結果を取り出してresultに代入
    let result = {errors: {}, is_success: false, request: {}};
    await requestValidate.checkAsync(() => {
        //検証成功時処理
        result.is_success = true;
    }, () => {
        //検証拒否時処理
        result.is_success = false;
        result.errors.array = requestValidate.errors.first('array');
        result.errors.medicine1 = requestValidate.errors.first('medicine1');
        result.errors.medicine2 = requestValidate.errors.first('medicine2');
        result.errors.medicine3 = requestValidate.errors.first('medicine3');
        result.errors.medicine4 = requestValidate.errors.first('medicine4');
        result.errors.medicine5 = requestValidate.errors.first('medicine5');
        result.errors.medicine6 = requestValidate.errors.first('medicine6');
        result.errors.medicine7 = requestValidate.errors.first('medicine7');
        result.errors.medicine8 = requestValidate.errors.first('medicine8');
        result.errors.medicine9 = requestValidate.errors.first('medicine9');
        result.request = requests;
    })
    return result;
}

module.exports = validationTakeTime;