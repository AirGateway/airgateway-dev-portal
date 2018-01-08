/**************/
/* LOGIN PAGE */
/**************/


$loginForm = $('#login-panel').find('form');
var loginFormValidationSettings = {
    errorClass: "error",
};

$loginForm.validate(loginFormValidationSettings);
$loginForm.submit(function (e) {
    e.preventDefault();
    resetFormErrors();

    $form = $(this);
    if ($form.valid()) {
        var data = $(this).serialize();

        $.ajax({
            method: 'POST',
            data: data,
            url: host + urlMap.login,
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