/******************/
/* CHAT HANDLERS */
/******************/

$formContainer = $('#form-panel');

if ($formContainer.length) {
    var tplDynamicForm = underscore.template($('#tpl_dynamic_form').html());
    var pocket = location.search.substr(1).split('&');
    var id = '';
    var planID = '';
    for (var i in pocket) {
        var innerPocket = pocket[i].split('=')
        if (innerPocket[0] === 'id') {
            id = innerPocket[1];
        }

        if (innerPocket[0] === 'planID') {
            planID = innerPocket[1];
        }
    }

    if (!id) {
        location.href = '/';
    }

    if (!planID) {
        location.href = '/';
    }

    $.signedAjax({
        url: host + urlMap.form + "/" + id,
        success: function (response) {
            if (response.status === 'OK') {
                if (response.result) {
                    for (var i in response.result) {
                        var item = response.result[i];
                        if (item.indexOf(',') !== -1) {
                            item = item.split(',')
                        }
                        response.result[i] = item;
                    }

                }

                $formContainer.html(tplDynamicForm({
                    title: response.data.title,
                    description: response.data.description,
                    elements: response.data.form_elements,
                    result: response.result
                }));
            }
        },
        error: function (result) {
            if (result.status === 401) {
                $('#logout').click();
            } else {
                location.href = '/'
            }
        }
    });


    $(document).on('click', '.formSubmit', function (e) {
        e.preventDefault();
        var form = $('#dynamicForm');
        if (!form.valid()) {
            return
        }

        $.signedAjax({
            url: host + urlMap.form + "/" + id,
            method: "POST",
            data: form.serialize(),
            success: function (response) {
                if (response.status == 'OK') {
                    location.href = '/member/onboarding/?id=' + planID;
                }
            },
            error: function (result) {
                if (result.status === 401) {
                    $('#logout').click();
                } else {
                    location.href = '/'
                }
            }
        });
    });
}