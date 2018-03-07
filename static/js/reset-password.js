/***********************/
/* RESET PASSWORD PAGE */
/***********************/

$resetPasswordPanel = $('#reset-password-panel');
if ($resetPasswordPanel.length) {
    $resetPasswordForm = $resetPasswordPanel.find('form');
    var resetPasswordFormValidationSettings = {
        errorClass: "error"
    };

    var pocket = location.search.substr(1).split('&');
    var resetPasswordHash = '';
    for (var i in pocket) {
        var innerPocket = pocket[i].split('=');
        if (innerPocket[0] === 'hash') {
            resetPasswordHash = innerPocket[1];
        }
    }

    $resetPasswordForm.validate(resetPasswordFormValidationSettings);
    $resetPasswordForm.submit(function (e) {
        e.preventDefault();
        resetFormErrors();

        $form = $(this);
        if ($form.valid()) {
            var data = $(this).serialize();
            data += encodeURI("&hash=" + resetPasswordHash);

            $.ajax({
                method: 'POST',
                data: data,
                url: host + urlMap.resetPassword,
                success: function (response) {
                    if (response.status === 'ERROR') {
                        showFormErrors(response.error);
                    } else {
                        location.href = "/login/";
                    }
                }
            });
        }
    });

}
