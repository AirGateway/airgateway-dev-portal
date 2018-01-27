/******************/
/*  ONBOARDING LISTING  */
/******************/
$onboardingPanel = $('#onboarding-panel');
$onboardingContainer = $('.onboarding-container');
$onboardingDocsContainer = $('.onboarding-docs-container');

if ($onboardingPanel.length) {
    var tplOnboarding = underscore.template($('#tpl_onboarding').html());
    var tplOnboardingFiles = underscore.template($('#tpl_onboarding_files').html());
    var tplOnboardingUploadedDocuments = underscore.template($('#tpl_onboarding_uploaded_files').html());

    var onboardingFiles = [];
    var pocket = location.search.substr(1).split('=');
    var id = '';
    if (pocket[0] === 'id') {
        id = pocket[1];
    }
    if (!id) {
        location.href = '/';
    }
    var isDocumentNeeded = false;

    $.signedAjax({
        url: host + urlMap.planOnboardingInfo + '/' + id,
        success: function (response) {
            var actions = [];
            var keys = Object.keys(response.actions);
            var counter = 1;
            // search for messages
            for (var i in keys) {
                var key = keys[i];
                var action = response.actions[key];
                if (action.type === 'message') {
                    actions.push(counter + ') Read: ' + action.message);
                    counter++;
                }
            }

            // search for forms
            for (var i in response.forms) {
                var action = response.actions[response.forms[i].action_id];
                if (action) {
                    actions.push(counter + ') Please complete "<a href="/member/form/?id=' + response.forms[i].id + '&planID='+ id +'">' + action.form_title + '</a>" form' + (response.forms[i].status ? ' (done)' : ''));
                    counter++;
                }
            }
            for (var i in keys) {
                var key = keys[i];
                var action = response.actions[key];
                if (action.type === 'document') {
                    isDocumentNeeded = true;
                    actions.push(counter + ') Upload document: ' + action.message);
                    counter++;
                }
            }
            $onboardingContainer.html(tplOnboarding({
                states: response.states,
                current: response.current_state_number,
                total: response.total_state_number,
                actions: actions,
                isDocumentNeeded: isDocumentNeeded,
                documents: response.documents,
            }));

            $('.bs-wizard-wrap').scrollLeft(100 * (response.current_state_number-1));

            $('#fileupload').fileupload({
                url: host + urlMap.document + 'plan/' + id,
                headers: {
                    'Ag-Auth-Dev': localStorage.token
                },
                paramName: 'file',
                sequentialUploads: true,
                autoUpload: false,
                add: function (e, data) {
                    can = true;
                    onboardingFiles.map(function (item) {
                        if (item.name == data.files[0].name) {
                            can = false;
                        }
                    });
                    if (can) {
                        onboardingFiles.push(data.files[0]);
                        renderChatFiles();
                    }
                },
                done: function (e, data) {
                    onboardingFiles = [];
                    renderChatFiles();
                    loadDocumentList();
                }
            });

            loadDocumentList();
        },
        error: function (result) {
            if (result.status == 401) {
                $('#logout').click();
            }
        }
    });

    function loadDocumentList() {
        $.signedAjax({
            url: host + urlMap.document + 'plan/' + id,
            success: function (response) {
                $onboardingDocsContainer.html(tplOnboardingUploadedDocuments({
                    planID: id,
                    documents: response,
                    isDocumentNeeded: isDocumentNeeded
                }));
            },
            error: function (result) {
                if (result.status == 401) {
                    $('#logout').click();
                }
            }
        })
    }

    function removeItemFromQueue(i) {
        onboardingFiles.splice(i,1);
        renderChatFiles();
    }

    function renderChatFiles() {
        $('#fileitem-queue').html(tplOnboardingFiles({
            files: onboardingFiles
        }));

        if (onboardingFiles.length) {
            $('.uploadBtn').removeClass('hide')
        } else {
            $('.uploadBtn').addClass('hide')
        }
    }

    function removeDocument(planID, id) {
        $.signedAjax({
            method: 'DELETE',
            url: host + urlMap.document + id + '/plan/' + planID,
            success: function (response) {
                if (response.status == 'OK') {
                    loadDocumentList()

                }
            },
            error: function (result) {
                if (result.status == 401) {
                    $('#logout').click();
                }
            }
        });

    }

    function uploadQueuedFiles() {
        $('#fileupload').fileupload('send', {files: onboardingFiles});
    }


    function submitOnboarding() {
        $.signedAjax({
            method: 'POST',
            url: host + urlMap.planOnboardingSubmit + '/' + id ,
            success: function (response) {
                if (response.status == 'OK') {
                    $('.resultMessage').removeClass("hide")
                }
            },
            error: function (result) {
                if (result.status == 401) {
                    $('#logout').click();
                }
            }
        });
    }
}



