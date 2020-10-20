document.addEventListener('DOMContentLoaded', () => {
    bindAutocompleteMedicineName();
    bindAutocompleteHospital();

    addMedicine([]);
});

function bindAutocompleteMedicineName() {
    $('.autocomplete-medicine-name').autocomplete({
        source: (request, response) => {
            $.getJSON('/data/medicine.json', (data) => {
                let array = $.map(data, (value) => {
                    return value.data;
                });
                let result = $.ui.autocomplete.filter(array, request.term);
                response(result.slice(0, 30));
            });
        }
    });
}

function bindAutocompleteHospital() {
    $('.autocomplete-hospital').autocomplete({
        source: (request, response) => {
            $.getJSON('/data/hospital.json', (data) => {
                let array = $.map(data, (value) => {
                    return value.data;
                });
                let result = $.ui.autocomplete.filter(array, request.term);
                response(result.slice(0, 30));
            });
        }
    });
}

function ocrImagePicker() {
    const notyf = new Notyf({
        position: {
            y: 'top',
        },
    });

    let file = document.createElement('input');
    file.type = 'file';
    file.accept = 'image/jpeg,image/png';
    file.click();
    file.onchange = async function () {
        swal('解析中です…', {
            buttons: false,
            closeOnEsc: false,
            closeOnClickOutside: false
        });
        let obj = $(file).prop('files')[0];
        if (obj === undefined) {
            return;
        }
        let formData = new FormData();
        formData.append('image', obj);
        $.ajax({
            url: '/api/ocr',
            type: 'POST',
            data: formData,
            processData: false,
            contentType: false
        }).done(function(response) {
            swal.close();
            if (Object.keys(response).length === 0) {
                notyf.error('文字を検出できませんでした');
            } else {
                notyf.success('文字を検出しました');

                for (let i = 0; i < response['result'].length; i++) {
                    console.log(response['result'][i]['result']);
                    let medicineName = response['result'][i]['result'];

                    addMedicine({
                        'medicine_name': medicineName
                    });
                }
            }
        }).fail(function() {
            swal.close();
            notyf.error('解析に失敗しました');
        });
    }
}

function addMedicine(values) {
    let source = $('#template_medicine_item').html();
    let template = Handlebars.compile(source);
    let html = template(values);
    let body = $('#medicine-list')[0];
    body.insertAdjacentHTML('beforeend', html);

    $('.select2').select2();
    bindAutocompleteMedicineName();
}

function deleteMedicine(button) {
    let target = $(button).parents('div[data-type=medicine-item]');
    target.remove();
}
