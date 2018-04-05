/**************/
/* PROFILE PAGE */
/**************/


$profileForm = $('#profile-panel').find('form');
var profileFormValidationSettings = {
    errorClass: "error"
};

$profileForm.validate(profileFormValidationSettings);
$profileForm.submit(function (e) {
    e.preventDefault();
    resetFormErrors();

    $form = $(this);
    if ($form.valid()) {
        var data = $(this).serialize();

        $.signedAjax({
            method: 'POST',
            data: data,
            url: host + urlMap.profile,
            success: function (response) {
                if (response.status === 'ERROR') {
                    showFormErrors(response.error);
                } else {
                    showFormSuccess();
                }
            }
        });
    }
});

if ($profileForm.length) {
    $.signedAjax({
        url: host + urlMap.profile,
        success: function (response) {
            if (response.status === 'OK') {
                $submitBtn = $profileForm.find('input[type=submit]');

                $('input[name=username]').val(response.data.email);
                $('textarea[name=public_key]').val(response.data.public_key);

                for (var i in response.data.fields) {
                    var name = lodash.snakeCase(i);

                    $submitBtn.before(tplInput({
                        name: name,
                        label: i,
                        value: response.data.fields[i]
                    }));
                }
            }
        }
    });
}
