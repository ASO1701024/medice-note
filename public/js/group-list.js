$(document).on('click', '.group-delete', function () {
    let form = $(this).closest('form');

    swal({
        title: 'グループ削除',
        text: 'グループを削除しますか？\nグループに登録されている薬情報はデフォルトグループに移動されます',
        icon: 'warning',
        buttons: ['キャンセル', '削除'],
        dangerMode: true
    }).then(function (value) {
        if (value) {
            form.submit();
        }
    });
});
