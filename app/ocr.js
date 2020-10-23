const distance = require('jaro-winkler');

module.exports = {
    getOCRText: (jsonObject) => {
        let medicineJSONData = getMedicineData();
        let OCRText = splitLine(jsonObject);

        let medicineNameList = getSimilarMedicineName(OCRText, medicineJSONData);

        return medicineNameList;

        // 類似率が高い薬品名を検索し、類似率最大の名前を返す。
        // 類似率が全てにおいて0.9以下 = 薬品名ではないと判断し、戻り値の配列には含めない。
        function getSimilarMedicineName(OCRText, medicineList) {
            let nameList = [];
            let minDistance = 0.9;
            for (let item of OCRText) {
                let maxDistance = 0;
                let result = '';
                for (let target of medicineList) {
                    let distanceResult = distance(item, target['data']);
                    if (distanceResult > minDistance) {
                        if (maxDistance < distanceResult) {
                            maxDistance = distanceResult
                            result = target['data'];
                        }
                    }
                }
                if (result) {
                    nameList.push({defaultText: item, result: result});
                }
            }
            return nameList;
        }

        // jsonから薬の名前一覧を取得し、配列で返す。
        function getMedicineData() {
            let medicineList = require('../public/data/medicine.json');
            return medicineList;
        }

        // cloud visionから受け取ったjson内のテキストデータを行ごとに分割し、配列で返す。
        function splitLine(jsonObject) {
            let splitText = jsonObject['fullTextAnnotation']['text'].split('\n');
            return splitText.slice(0, splitText.length - 1)
        }
    },
}