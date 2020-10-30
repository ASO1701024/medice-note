const distance = require('jaro-winkler');

// getOCRText()でインスタンス化。
// 各種抽出処理を実装する。
class DistanceChecker {
    constructor(OCRData) {
        this.OCRData = OCRData;
        this.checkTargetList = [];
        this.resultList = {};
    }

    // getOCRText()で処理内容を設定し、execute()から一括して実行。
    setTarget(targetName, checkType, args) {
        this.checkTargetList.push(new CheckTarget(targetName, checkType, args));
        return this;
    }

    setResult(target, item) {
        this.resultList[target.name] = item || '';
    }

    // 設定したCheckTargetの処理を実行。
    execute() {
        for (let target of this.checkTargetList) {
            let result;
            switch (target.checkType) {
                case 1:
                    let medicineItem = this.getSimilarData(target);
                    let takeNumberResult = this.getTakeNumber();
                    for (let medicineIndex in medicineItem){
                        medicineItem[medicineIndex]['takeNumber'] = takeNumberResult[medicineIndex] || '';
                    }
                    result = medicineItem;
                    break;
                case 2:
                    let hospitalNameList = this.getSimilarData(target);
                    result = getFirst(hospitalNameList);
                    break;
                case 3:
                    result = this.getMedicinePeriod();
                    break;
                case 4:
                    result = this.getDate();
                    break;
            }
            this.setResult(target, result);
        }
        return this.resultList;
    }

    // 類似率が高いデータを検索し、比較対象内から類似率最大のデータを返す。
    // 類似率が全てにおいてminDistance以下の場合、薬品名ではないと判断して戻り値の配列には含めない。
    getSimilarData(target) {
        let dataList = [];
        for (let row of this.OCRData) {
            let maxDistance = 0;
            let result = '';
            for (let data of target.args['targetList']) {
                let distanceResult = distance(row, data['data']);
                if (distanceResult > target.args['minDistance']) {
                    if (maxDistance < distanceResult) {
                        maxDistance = distanceResult
                        result = data['data'];
                    }
                }
            }
            if (result) {
                dataList.push({defaultText: row, result: result});
            }
        }
        return dataList;
    }

    // 処方期間を返す。現在は'日分'の直前の日付を返している。
    getMedicinePeriod() {
        for (let row of this.OCRData) {
            let periodIndex = row.indexOf('日分');
            if (periodIndex >= 0) {
                let periodString = '';
                for (let i = periodIndex - 1; i >= 0; i--) {
                    if (isFinite(row.substring(i, periodIndex))) {
                        periodString = row.substring(i, periodIndex);
                    } else {
                        return periodString;
                    }
                }
                return periodString;
            }
        }
    }

    // 最初に抽出した日付を返す。
    getDate() {
        for (let row of this.OCRData) {
            let result = row.match(/(\d{4})(\/|年)(\d{1,2})(\/|月)(\d{1,2})/);
            if (result) {
                return result[1] + '-' + result[3] + '-' + result[5];
            }
            let result2 = row.match(/(令和)(\d{1,2})(\/|年)(\d{1,2})(\/|月)(\d{1,2})/);
            if (result2) {
                result2[2] = (parseInt(result2[2]) + 2018).toString();
                return result2[2] + '-' + result2[4] + '-' + result2[6];
            }
        }
    }

    // 一度に飲む数量を返す。
    // 前後の行も含めるとか、ある程度範囲を持って検索かける方向で作ってたけど、
    // 飲む個数は間違えられない項目だから、一番厳しく「.*1回x[単位].*」の形式でしか読み取らないようにする。
    getTakeNumber() {
        let takeTimeList = [];
        for (let row of this.OCRData) {
            let matchResult = row.match(/1回(\d)(個|カプセル|錠|包|ml|mL|g|mg)/);
            if (matchResult) {
                takeTimeList.push(matchResult[1]);
            }
        }
        return takeTimeList;
    }
}

// DistanceCheckerの調査対象。DistanceChecker.setTarget()でインスタンス化する。
class CheckTarget {
    constructor(targetName, checkType, args) {
        this.name = targetName;
        this.checkType = checkType;
        this.args = args;
    }
}

// 外部ファイルから呼び出して、最終的な処理結果を返す。
function getOCRText(jsonObject) {
    let medicineJSONData = getMedicineData();
    let hospitalJSONData = getHospitalData();
    let OCRText = splitLine(jsonObject);

    let checker = new DistanceChecker(OCRText);
    checker
        .setTarget('medicine', 1, {'targetList': medicineJSONData, 'minDistance': 0.9})
        .setTarget('hospitalName', 2, {'targetList': hospitalJSONData, 'minDistance': 0.9})
        .setTarget('period', 3)
        .setTarget('date', 4);

    return checker.execute();
}

// jsonから薬の名前一覧を取得し、配列で返す。
function getMedicineData() {
    return require('../public/data/medicine.json');
}

// jsonから病院名一覧を取得し、配列で返す。
function getHospitalData() {
    return require('../public/data/hospital.json');
}

// cloud visionから受け取ったjson内のテキストデータを行ごとに分割し、配列で返す。
function splitLine(jsonObject) {
    let splitText = jsonObject.split('\n');
    return splitText.slice(0, splitText.length - 1);
}

// getSimilarDataで取得した内、最初のデータのみを返す。
function getFirst(dataList) {
    return dataList[0];
}

module.exports = {
    getOCRText
}