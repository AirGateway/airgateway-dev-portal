
/*****************/
/* REGISTER PAGE */
/*****************/

$registerForm = $('#register-panel').find('form');
var signupFormValidationSettings = {
    errorClass: "error",
    rules: {
        password_confirm: {
            equalTo: "#password"
        }
    }
};

$registerForm.validate(signupFormValidationSettings);
$registerForm.submit(function (e) {
    e.preventDefault();
    resetFormErrors();

    $form = $(this);
    if ($form.valid()) {
        var data = $(this).serialize();

        $.ajax({
            method: 'POST',
            data: data,
            url: host + urlMap.signup,
            success: function (response) {
                if (response.status === 'ERROR') {
                    showFormErrors(response.error);
                } else {
                    localStorage.token = response.meta;
                    location.href = '/';
                }
            }
        });
    }
});

if ($registerForm.length) {
    $.ajax({
        url: host + urlMap.fields,
        success: function (response) {
            if (response.status === 'OK') {
                $submitBtn = $registerForm.find('input[type=submit]');
                for (var i in response.fields) {
                    var name = lodash.snakeCase(response.fields[i]);

                    $submitBtn.before(tplInput({
                        name: name,
                        label: response.fields[i],
                        value: '',
                    }));
                }
            }
        }
    });
}
