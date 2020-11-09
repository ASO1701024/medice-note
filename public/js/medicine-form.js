$(() => {
    $.getJSON('/data/medicine.min.json', (data) => {
        let array = $.map(data, (value) => {
            return value.data;
        })

        $('#medicine_name').autocomplete({
            source: (request, response) => {
                let result = $.ui.autocomplete.filter(array, request.term);
                response(result.slice(0, 30));
            }
        });
    });

    $.getJSON('/data/hospital.min.json', (data) => {
        let array = $.map(data, (value) => {
            return value.data;
        })

        $('#hospital_name').autocomplete({
            source: (request, response) => {
                let result = $.ui.autocomplete.filter(array, request.term);
                response(result.slice(0, 30));
            }
        });
    });

    let medicineImage = $('#medicine-image');
    let medicineImageLabel = $('#medicine-image-label');
    medicineImage.change(() => {
        if (medicineImage.prop('files')[0].name === '') {
            medicineImageLabel.text('ファイルを選択');
        } else {
            medicineImageLabel.text(medicineImage.prop('files')[0].name);
        }
    });
})