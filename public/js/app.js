// function convertTime(time) {
//     let array = time.split(':');
//     if (array[0] <= 9) {
//         array[0] = `0${array[0]}`;
//     }
//     time = `${array[0]}:${array[1]}`;
//
//     return time;
// }

$('.datepicker').daterangepicker({
    "singleDatePicker": true,
    "autoApply": true,
    "locale": {
        "format": "YYYY-MM-DD",
        "separator": " - ",
        // "applyLabel": "Apply",
        // "cancelLabel": "Cancel",
        // "fromLabel": "From",
        // "toLabel": "To",
        "customRangeLabel": "Custom",
        // "weekLabel": "W",
        "daysOfWeek": [
            "日",
            "月",
            "火",
            "水",
            "木",
            "金",
            "土"
        ],
        "monthNames": [
            "1月",
            "2月",
            "3月",
            "4月",
            "5月",
            "6月",
            "7月",
            "8月",
            "9月",
            "10月",
            "11月",
            "12月"
        ],
        "firstDay": 1
    }
});