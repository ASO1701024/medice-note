const distance = require('jaro-winkler');

// getOCRText()でインスタンス化。
// 各種抽出処理を実装する。
class DistanceChecker {
    constructor(OCRData) {
        this.OCRData = OCRData;
        this.checkTargetList = [];
        this.resultList = [];
    }

    // getOCRText()で処理内容を設定し、execute()から一括して実行。
    setTarget(targetName, checkType, args) {
        this.checkTargetList.push(new CheckTarget(targetName, checkType, args));
        return this
    }

    // 設定したCheckTargetの処理を実行。
    execute() {
        for (let target of this.checkTargetList) {
            switch (target.checkType) {
                case 1:
                    this.getSimilarData(target);
                    break;
                case 2:
                    this.getMedicinePeriod(target);
                    break;
            }
        }
        return this.resultList
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
        this.resultList.push({[target.name]: dataList});
    }

    // 処方期間を返す。現在は'日分'の直前の日付を返している。
    getMedicinePeriod(target) {
        for (let row of this.OCRData) {
            let periodIndex = row.indexOf('日分');
            if (periodIndex < 0) {

            } else {
                let periodString = '';
                for (let i = periodIndex - 1; i >= 0; i--) {
                    if (isFinite(row.substring(i, periodIndex))) {
                        periodString = row.substring(i, periodIndex);

                    } else {
                        this.resultList.push({[target.name]: periodString});
                        return
                    }
                }
                this.resultList.push({[target.name]: periodString});
            }
        }
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
        .setTarget('medicineName', 1, {'targetList': medicineJSONData, 'minDistance': 0.9})
        .setTarget('hospitalName', 1, {'targetList': hospitalJSONData, 'minDistance': 0.9})
        .setTarget('period', 2);

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
    return splitText.slice(0, splitText.length - 1)
}

module.exports = {
    getOCRText
}