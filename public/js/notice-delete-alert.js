function noticeDelete(noticeId) {
    swal({
        title: '通知削除',
        text: '通知情報を削除しますか？',
        icon: 'warning',
        buttons: ['キャンセル', '削除'],
        dangerMode: true
    }).then(function (value) {
        if (value) {
            location.href = `/notice-delete/${noticeId}`
        }
    });
}