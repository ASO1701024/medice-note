//受け取った薬情報を検証する。
//登録時と変更時に検証を行うため、外部ファイルから利用。
async function validation(items) {
    const validator = require('validatorjs');
    //データをvalidationするために整形
    let requests = {
        medicineName: String(items[0]),
        hospitalName: items[1],
        number: items[2],
        takeTime: items[3],
        adjustmentTime: items[4],
        startsYear: items[5].split('-')[0],
        startsMonth: items[5].split('-')[1],
        startsDay: items[5].split('-')[2],
        period: items[6],
        medicineType: items[7],
        image: items[8],
        description: items[9],
        groupId: items[10]
    };
    //validationのルール
    let rules = {
        medicineName: 'required|min:1',
        hospitalName: 'required|max:100',
        number: 'required|numeric',
        takeTime: 'required',
        adjustmentTime: 'required|numeric|min:0|max:180',
        startsYear: 'required|numeric|min:0',
        startsMonth: 'required|numeric|min:1|max:12',
        startsDay: 'required|numeric|min:1|max:31',
        period: 'required|min:0',
        medicineType: 'required|numeric',
        image: 'max:100',
        description: 'max:255',
        groupId: 'numeric|min:0'
    }
    //validation実行
    let requestValidate = new validator(requests, rules);

    //validationの結果を取り出してresultに代入
    let result = {errors: {}, is_success: false, request: {}};
    await requestValidate.checkAsync(() => {
        //検証成功時処理
        result.is_success = true;
    }, () => {
        //検証拒否時処理
        result.is_success = false;
        result.errors.medicineName = requestValidate.errors.first('medicineName');
        result.errors.hospitalName = requestValidate.errors.first('hospitalName');
        result.errors.number = requestValidate.errors.first('number');
        result.errors.takeTime = requestValidate.errors.first('takeTime')
        result.errors.adjustmentTime = requestValidate.errors.first('adjustmentTime');
        result.errors.startsYear = requestValidate.errors.first('startsYear');
        result.errors.startsMonth = requestValidate.errors.first('startsMonth');
        result.errors.startsDay = requestValidate.errors.first('startsDay');
        result.errors.period = requestValidate.errors.first('period');
        result.errors.medicineType = requestValidate.errors.first('medicineType');
        result.errors.image = requestValidate.errors.first('image')
        result.errors.description = requestValidate.errors.first('description');
        result.errors.groupId = requestValidate.errors.first('groupId');
        result.request = items;
    })
    return result;
}

module.exports = validation;