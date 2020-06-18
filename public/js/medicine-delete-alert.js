function medicineDelete(medicineId) {
    swal({
        title: '薬情報削除',
        text: 'お薬情報を削除しますか？',
        icon: 'warning',
        buttons: ['キャンセル', '削除'],
        dangerMode: true
    }).then(function (value) {
        if (value) {
            location.href = '/medicine-delete/' + medicineId
        }
    });
}