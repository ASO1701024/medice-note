$("#modal-setting-button").fireModal({
    title: '表示設定',
    body: $("#modal-setting-layout"),
    footerClass: 'bg-whitesmoke',
    autoFocus: false,
    center: true,
    created: function (modal) {
        console.log('created')
        console.log(modal);
    },
    appended: function (modal, form) {
        console.log('appended')
        console.log(modal);
        console.log(form);
    },
    onFormSubmit: function (modal, e, form) {
        let data = $(e.target);
        data = data[0];

        let hospitalName = data.checkboxHospitalName.checked;
        let number = data.checkboxNumber.checked;
        let takeTime = data.checkboxTakeTime.checked;
        let typeName = data.checkboxTypeName.checked;
        let group = data.checkboxGroup.checked;
        let description = data.checkboxDescription.checked;

        let array = {
            'hospitalName': hospitalName,
            'number': number,
            'takeTime': takeTime,
            'typeName': typeName,
            'group': group,
            'description': description
        }
        localStorage.setItem('show_item', JSON.stringify(array));

        form.stopProgress();

        e.preventDefault();
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
