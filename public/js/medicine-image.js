$(() => {
    let medicineImage = $('#medicine-image');
    let medicineImageLabel = $('#medicine-image-label');
    medicineImage.change(() => {
        if (medicineImage.prop('files')[0].name === '') {
            medicineImageLabel.text('ファイルを選択');
        } else {
            medicineImageLabel.text(medicineImage.prop('files')[0].name);
        }
    })
})