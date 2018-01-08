/******************/
/* CHAT HANDLERS */
/******************/

$formContainer = $('#form-panel');

if ($formContainer.length) {
    var tplDynamicForm = underscore.template($('#tpl_dynamic_form').html());
    var pocket = location.search.substr(1).split('=');
    var id = '';
    if (pocket[0] === 'id') {
        id = pocket[1];
    }
    if (!id) {
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
console.log(response.result);
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

        $.signedAjax({
            url: host + urlMap.form + "/" + id,
            method: "POST",
            data: $('#dynamicForm').serialize(),
            success: function (response) {
                if (response.status == 'OK') {
                    location.href = '/member/chat/';
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