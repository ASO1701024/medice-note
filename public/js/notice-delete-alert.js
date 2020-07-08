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

function noticeToggleTrue(noticeId) {
    swal({
        title: '無効中',
        text: 'この通知は無効状態です。有効化しますか？',
        icon: 'warning',
        buttons: ['キャンセル', '有効化'],
        dangerMode: true
    }).then(function (value) {
        if (value) {
            // location.href = '/medicine-delete/' + medicineId
        }
    });
}

function noticeToggleFalse(noticeId) {
    swal({
        title: '有効中',
        text: 'この通知は有効状態です。無効化しますか？',
        icon: 'warning',
        buttons: ['キャンセル', '無効化'],
        dangerMode: true
    }).then(function (value) {
        if (value) {
            // location.href = '/medicine-delete/' + medicineId
        }
    });
}