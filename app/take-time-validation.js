const connection = require('../app/db');
const validator = require('validatorjs');

async function validationTakeTime(items) {
    let result = {errors: {array:"", items:[]}, is_success: false, request: []};
    // 配列が空でないか確認
    let arrayRequest = {array:items};
    let arrayRules = {array: 'required'};
    let arrayErrorMessage = {'required': "飲む時間は必須項目です"};
    let arrayValidate = new validator(arrayRequest, arrayRules, arrayErrorMessage);
    await arrayValidate.checkAsync(() => {
        // 検証成功時処理
        result.is_success = true;
    }, () => {
        // 検証拒否時処理
        result.is_success = false;
        result.errors.array = arrayValidate.errors.first('array');
        result.request = items;
    })
    // 配列が空の場合は拒否
    if(result.is_success === false){
        return result
    }

    // 存在するtakeTimeIdをDBから取得。
    let sql = 'SELECT take_time_id FROM take_time;';
    let typeListResult = (await connection.query(sql))[0];
    let typeList = [];
    for(let row of typeListResult){
        typeList.push(String(row['take_time_id']));
    }

    let itemValidatorList = [];
    for(let row of items){
        let itemRequest = {item: row};
        let itemRules = {item: ['numeric', {'in': typeList}]};
        let itemErrorMessage = {
            'numeric': "飲む時間はチェックボックスから選択して下さい",
            'in': "飲む時間はチェックボックスから選択して下さい",
        }
        itemValidatorList.push(new validator(itemRequest,itemRules,itemErrorMessage));
    }
    for(let row of itemValidatorList){
        await row.checkAsync( () => {
        }, () => {
            result.is_success = false;
            result.errors.items.push(row.errors.first('item'));
            if(result.request.length === 0){
                result.request = items;
            }
        });
    }
    return result;
}

module.exports = validationTakeTime;