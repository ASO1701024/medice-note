document.addEventListener('DOMContentLoaded', function () {
    let showItem = JSON.parse(localStorage.getItem('show_item'));
    if (showItem === undefined || showItem === null) {
        showItem = {
            'hospitalName': true,
            'number': true,
            'takeTime': true,
            'date': true,
            'typeName': false,
            'group': false,
            'description': false
        }
        localStorage.setItem('show_item', JSON.stringify(showItem));
    }
});

window.onload = function () {
    let showItem = JSON.parse(localStorage.getItem('show_item'));
    toggleShowItem(showItem);

    $("#modal-setting-button").fireModal({
        title: '表示設定',
        body: $("#modal-setting-layout"),
        footerClass: 'bg-whitesmoke',
        autoFocus: false,
        center: true,
        appended: function (modal, form) {
            let data = form[0];
            let showItem = JSON.parse(localStorage.getItem('show_item'));

            data.checkboxHospitalName.checked = showItem['hospitalName'];
            data.checkboxNumber.checked = showItem['number'];
            data.checkboxTakeTime.checked = showItem['takeTime'];
            data.checkboxDate.checked = showItem['date'];
            data.checkboxTypeName.checked = showItem['typeName'];
            data.checkboxGroup.checked = showItem['group'];
            data.checkboxDescription.checked = showItem['description'];
        },
        onFormSubmit: function (modal, e, form) {
            let data = $(e.target);
            data = data[0];

            let hospitalName = data.checkboxHospitalName.checked;
            let number = data.checkboxNumber.checked;
            let takeTime = data.checkboxTakeTime.checked;
            let date = data.checkboxDate.checked;
            let typeName = data.checkboxTypeName.checked;
            let group = data.checkboxGroup.checked;
            let description = data.checkboxDescription.checked;

            let array = {
                'hospitalName': hospitalName,
                'number': number,
                'takeTime': takeTime,
                'date': date,
                'typeName': typeName,
                'group': group,
                'description': description
            }
            localStorage.setItem('show_item', JSON.stringify(array));
            toggleShowItem(array);

            form.stopProgress();

            e.preventDefault();
            $.destroyModal(modal);
        },
        buttons: [
            {
                text: '閉じる',
                class: 'btn btn-secondary',
                handler: function (modal) {
                    $.destroyModal(modal);
                }
            },
            {
                text: '保存',
                submit: true,
                class: 'btn btn-primary btn-shadow',
                handler: function (modal) {
                }
            }
        ]
    });
}

function toggleShowItem(showItem) {
    $('div[data-list-name=hospital_name]').each(function (index, element) {
        if (showItem['hospitalName']) {
            $(element).css('display', 'block');
        } else {
            $(element).css('display', 'none');
        }
    });
    $('div[data-list-name=number]').each(function (index, element) {
        if (showItem['number']) {
            $(element).css('display', 'block');
        } else {
            $(element).css('display', 'none');
        }
    });
    $('div[data-list-name=take_time]').each(function (index, element) {
        if (showItem['takeTime']) {
            $(element).css('display', 'block');
        } else {
            $(element).css('display', 'none');
        }
    });
    $('div[data-list-name=date]').each(function (index, element) {
        if (showItem['date']) {
            $(element).css('display', 'block');
        } else {
            $(element).css('display', 'none');
        }
    });
    $('div[data-list-name=type_name]').each(function (index, element) {
        if (showItem['typeName']) {
            $(element).css('display', 'block');
        } else {
            $(element).css('display', 'none');
        }
    });
    $('div[data-list-name=group]').each(function (index, element) {
        if (showItem['group']) {
            $(element).css('display', 'block');
        } else {
            $(element).css('display', 'none');
        }
    });
    $('div[data-list-name=description]').each(function (index, element) {
        if (showItem['description']) {
            $(element).css('display', 'block');
        } else {
            $(element).css('display', 'none');
        }
    });
}
