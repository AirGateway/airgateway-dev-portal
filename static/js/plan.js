/******************/
/*  PLAN LISTING  */
/******************/
$planListingPage = $('#plan-panel').length;
$planContainer = $('.plan-container');
$planMessageContainer = $('.planMessage-container');

if ($planListingPage) {
    var keyRequestFields = [];
    var tplPlan = underscore.template($('#tpl_plan').html());
    var tplPlanMessage = underscore.template($('#tpl_plan_message').html());

    $.signedAjax({
        url: host + urlMap.requestFields,
        success: function (response) {
            if (response.status === 'OK') {
                keyRequestFields = response.fields;
            }
        },
        error: function (result) {
            if (result.status == 401) {
                $('#logout').click();
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
                    status: response.data[i].status,
                }))
            }
        },
        error: function (result) {
            if (result.status == 401) {
                $('#logout').click();
            }
        }
    });

    $.signedAjax({
        url: host + urlMap.plansMessage,
        success: function(response) {
            var actions = [];
            var keys = Object.keys(response.actions);
            var counter = 1;
            // search for messages
            for (var i in keys) {
                var key = keys[i];
                var action = response.actions[key];
                if (action.type === 'message') {
                    actions.push(counter +') '+ action.message)
                    counter++;
                }
            }

            // search for messages
            for (var i in response.forms) {
                var action = response.actions[response.forms[i].action_id];
                actions.push(counter +') Please complete "<a href="/member/form/?id='+ response.forms[i].id +'">'+ action.form_title +'</a>"')
                counter++;
            }

        console.log(actions);
            $planMessageContainer.html(tplPlanMessage({
                current: response.current_state_number,
                total: response.states_count,
                actions: actions
            }))
        },
        error: function (result) {
            if (result.status == 401) {
                $('#logout').click();
            }
        }
    })
}

$(document).on('click', '.planRequest', function (e) {
    e.preventDefault();
    var $planForm = $('#plan-form');
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
        error: function (result) {
            if (result.status == 401) {
                $('#logout').click();
            }
        }
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
    var showErrorAccessResult = function () {
        $('.error-access').addClass('in');
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
        error: function (response) {
            $('#plan-result').addClass('in');
            $('#plan-form-panel').removeClass('in');
            if (response.responseJSON.status === 'ERROR_EXIST') {
                showErrorExistResult();
            } else if (response.responseJSON.status === 'ERROR_ACCESS') {
                showErrorAccessResult();
            }
        }
    });
}

