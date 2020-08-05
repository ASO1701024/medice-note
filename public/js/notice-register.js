function getMedicine(medicineId) {
    let dom = $('#medicine_preview');

    fetch(`/api/medicine/${medicineId}`)
        .then(async response => {
            let json = await response.json()

            switch (json.status) {
                case 200:
                    let template = Handlebars.compile($('#template_notice_medicine_info').html());
                    let data = {
                        medicine_id: json.data.medicine_id,
                        medicine_name: json.data.medicine_name,
                        hospital_name: json.data.hospital_name,
                        number: json.data.number,
                        starts_date: json.data.starts_date,
                        period: json.data.period,
                        type_name: json.data.type_name,
                        group_name: json.data.group_name
                    };

                    if (json.data.description === '') {
                        json.data.description = '登録されていません';
                    }
                    data['description'] = json.data.description;

                    data['take_time'] = ''
                    for (let i = 0; i < json.data.take_time.length; i++) {
                        data['take_time'] += json.data.take_time[i];
                        if (json.data.take_time.length - 1 !== i) {
                            data['take_time'] += '・'
                        }
                    }

                    dom.html(template(data));
                    break;
                case 400:
                    dom.html(`<p class="text-muted">${json.reason}</p>`);
                    break;
            }
        })
        .catch(() => {
            dom.html(`<p class="text-muted">データを取得できませんでした</p>`);
        })
}

function setMedicineItem() {
    let form = $('#medicine_info');
    let medicineId = form.find('input[name=medicine_id]').val();
    let medicineName = form.find('input[name=medicine_name]').val();
    let number = form.find('input[name=number]').val();

    let dom = $('#medicine_table tbody');
    let template = Handlebars.compile($('#template_notice_medicine_item').html());
    let data = {
        medicine_id: medicineId,
        medicine_name: medicineName,
        number: number,
    };

    dom.append(template(data));
}

$(document).on('click', '.table-tr-delete', function () {
    $(this).closest('tr').remove();
});

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

window.onload = () => {
    fetch('/js/template/notice-medicine-info.html')
        .then(async (response) => {
            let head = document.getElementsByTagName('head');
            head[0].insertAdjacentHTML('beforeend', await response.text());
        })

    fetch('/js/template/notice-medicine-item.html')
        .then(async (response) => {
            let head = document.getElementsByTagName('head');
            head[0].insertAdjacentHTML('beforeend', await response.text());
        })
}
