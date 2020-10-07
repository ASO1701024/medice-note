$(document).on('click', '.action-week-all-select', function () {
    let options = $('select[name=notice_day] > option');
    for (let i = 0; i < options.length; i++) {
        let option = options[i];
        $(option).attr({selected: true});
    }
    $('select[name=notice_day]').trigger('change');
});

$(document).on('click', '.action-week-weekday-select', function () {
    let options = $('select[name=notice_day] > option');
    for (let i = 0; i < options.length; i++) {
        let option = options[i];
        $(option).removeAttr('selected');
        switch ($(option).attr('value')) {
            case '1':
            case '2':
            case '3':
            case '4':
            case '5':
                $(option).attr({selected: true});
                break;
        }
    }
    $('select[name=notice_day]').trigger('change');
});

$(document).on('click', '.action-week-holiday-select', function () {
    let options = $('select[name=notice_day] > option');
    for (let i = 0; i < options.length; i++) {
        let option = options[i];
        $(option).removeAttr('selected');
        switch ($(option).attr('value')) {
            case '0':
            case '6':
                $(option).attr({selected: true});
                break;
        }
    }
    $('select[name=notice_day]').trigger('change');
});

$(document).on('click', '.action-week-all-deselect', function () {
    let options = $('select[name=notice_day] > option');
    for (let i = 0; i < options.length; i++) {
        let option = options[i];
        $(option).removeAttr('selected');
    }
    $('select[name=notice_day]').trigger('change');
});

$(document).on('click', '.medicine-popup-button', function () {
    let button = $(this)[0];
    let medicineId = $(button).data('medicine-id');
    let params = 'scrollbars=no,resizable=yes,status=no,location=no,toolbar=no,menubar=no,width=600,height=700,left=200,top=100';
    open(`/medicine/${medicineId}`, 'お薬情報', params);
})
