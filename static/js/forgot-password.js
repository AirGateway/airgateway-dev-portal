/**************/
/* LOGIN PAGE */
/**************/


$forgotPasswordForm = $('#forgot-password-panel').find('form');
var forgotPasswordFormValidationSettings = {
    errorClass: "error"
};

$forgotPasswordForm.validate(forgotPasswordFormValidationSettings);
$forgotPasswordForm.submit(function (e) {
    e.preventDefault();
    resetFormErrors();

    $form = $(this);
    if ($form.valid()) {
        var data = $(this).serialize();

        $.ajax({
            method: 'POST',
            data: data,
            url: host + urlMap.forgotPassword,
            success: function (response) {
                if (response.status === 'ERROR') {
                    showFormErrors(response.error);
                } else {
                    showForgotPasswordSuccess();
                }
            }
        });
    }
});

var showForgotPasswordSuccess = function (token) {
    $('.forgot-password').addClass('in');
};