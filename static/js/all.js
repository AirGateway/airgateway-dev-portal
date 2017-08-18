/****************/
/*    COMMON    */
/****************/
String.prototype.toUnderscore = function () {
    return this.replace(/([A-Z])/g, function ($1) {
        return "_" + $1.toLowerCase();
    });
};

$.signedAjax = function (data) {
    data = data || {};
    data.headers = data.headers || {};
    data.headers['Ag-Auth-Dev'] = localStorage.token;

    $.ajax(data);
};
var host = location.host.indexOf('portal.airgtwy.com') == -1 ? 'http://localhost:3001' : 'https://cloud.airgtwy.com/api/';
var urlMap = {
    login: '/auth/login',
    signup: '/auth/signup',
    fields: '/auth/signup-fields',
    graph: '',
    profile: '/portal/profile',
    plans: '/portal/plans',
    requestKey: '/portal/request-key/',
    invalidateKey: '/portal/invalidate-key/',
    requestFields: '/portal/request-key-fields'
};
var tplInput = underscore.template($('#tpl_input').html());
var tplMenu = underscore.template($('#tpl_menu').html());
var tplHiddenInput = underscore.template($('#tpl_hidden_input').html());

//initialization
$(function () {
    //1. render dynamic part of layout template
    $('.nav .container').append(tplMenu());
});


$summaryErrors = $('.error-summary');
$successFormPanel = $('.success-form');

function resetFormErrors() {
    $summaryErrors.hide();
}

function showFormErrors(errors) {
    $panel = $summaryErrors.find('.panel-body');
    $panel.html('');

    var errorKeys = Object.keys(errors);
    for (var i in errorKeys) {
        var k = errorKeys[i];
        $panel.append(k + ': ' + errors[k] + '<br>');
    }

    $summaryErrors.show();
}

function showFormSuccess() {
    $successFormPanel.show();
    $(window).scrollTop(0, 0);

}

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
                if (response.status === 'error') {
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
                if (response.status === 'error') {
                    showFormErrors(response.error);
                } else {
                    localStorage.token = response.meta;
                    location.href = '/';
                }
            }
        });
    }
});

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
                if (response.status === 'error') {
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

/******************/
/*  PLAN LISTING  */
/******************/
$planListingPage = $('#plan-panel').length;
$planContainer = $('.plan-container');
if ($planListingPage) {
    var keyRequestFields = [];
    var tplPlan = underscore.template($('#tpl_plan').html());

    $.signedAjax({
        url: host + urlMap.requestFields,
        success: function (response) {
            if (response.status === 'OK') {
                keyRequestFields = response.fields;
            }
        }
    });

    $.signedAjax({
        url: host + urlMap.plans,
        success: function (response) {
            for (var i in response.data) {
                $planContainer.append(tplPlan({
                    id: response.data[i].id,
                    name: response.data[i].name,
                    short_description: response.data[i].short_description,
                    activated: response.data[i].activated,
                }))
            }
        }
    });
}

$(document).on('click', '.planRequest', function (e) {
    e.preventDefault();
    $planForm = $('#plan-form');
    $planForm.prepend(tplHiddenInput({
        name: 'plan_id',
        value: $(this).data('plan')
    }));

    if (keyRequestFields.length) {
        for (var i in keyRequestFields) {
            var name = lodash.snakeCase(keyRequestFields[i]);
            if (!$planForm.find('[name="' + name + '"]').length) {
                $planForm.prepend(tplInput({
                    name: name,
                    label: keyRequestFields[i],
                    value: ''
                }));
                $planForm.find('[name="' + name + '"]').attr('required', true);
            }
        }

        $('#plan-panel').removeClass('in');
        $('#plan-form-panel').addClass('in');
    } else {
        $planForm.submit();
    }
});

$(document).on('click', '.invalidateKey', function (e) {
    e.preventDefault();

    $.signedAjax({
        method: 'POST',
        url: host + urlMap.invalidateKey + $(this).data('plan'),
        success: function (response) {
            if (response.status === 'OK_INVALIDATED') {
                $('#plan-result').addClass('in');
                $('#plan-panel').removeClass('in');
                $('.ok-invalidated').addClass('in');
            }
        },
    });
});

$(document).on('submit', '#plan-form', function (e) {
    e.preventDefault();
    $('#plan-panel').removeClass('in');
    sendKeyRequest($(this));
});

function sendKeyRequest($form) {
    var showErrorExistResult = function () {
        $('.error-exist').addClass('in');
    };
    var showRequestKeyResult = function () {
        $('.ok-requested').addClass('in');
    };
    var showApprovedKeyResult = function (token) {
        $('.ok-approved').addClass('in');
        $('.ok-approved-key').html(token);
    };

    $.signedAjax({
        method: 'POST',
        data: $form.serialize(),
        url: host + urlMap.requestKey + $form.find('[name="plan_id"]').val(),
        success: function (response) {
            $('#plan-result').addClass('in');
            $('#plan-form-panel').removeClass('in');

            if (response.status === 'OK_APPROVED') {
                showApprovedKeyResult(response.meta);
            } else if (response.status === 'OK_REQUESTED') {
                showRequestKeyResult();
            }
        },
        error: function(response) {
            $('#plan-result').addClass('in');
            $('#plan-form-panel').removeClass('in');
            if (response.responseJSON.status === 'ERROR_EXIST') {
                showErrorExistResult();
            }
        }
    });
}


//1. open page /apis/ - call /portal/request-key-fields
//2.

/******************/
/* OTHER HANDLERS */
/******************/

$(document).on('click', '#logout', function (e) {
    e.preventDefault();
    delete localStorage.token;
    location.href = '/';
});

