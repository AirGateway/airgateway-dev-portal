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
var host = 'http://localhost:3001';
var urlMap = {
    login: '/auth/login',
    signup: '/auth/signup',
    fields: '/auth/signup-fields',
    graph: '',
    profile: '/portal/profile',
    plans: '/portal/plans'
};
var tplInput = underscore.template($('#tpl_input').html());
var tplMenu = underscore.template($('#tpl_menu').html());
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
                        value:  response.data.fields[i]
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
    var tplPlan= underscore.template($('#tpl_plan').html());

    $.signedAjax({
        url: host + urlMap.plans,
        success: function (response) {
            console.log(response);
            for (var i in response.data) {
                $planContainer.append(tplPlan({
                    id: response.data[i].id,
                    name: response.data[i].name,
                    short_description: response.data[i].short_description,
                }))
            }
        }
    });
}


/******************/
/* OTHER HANDLERS */
/******************/

$(document).on('click', '#logout', function (e) {
    e.preventDefault();
    delete localStorage.token;
    location.href = '/';
});

