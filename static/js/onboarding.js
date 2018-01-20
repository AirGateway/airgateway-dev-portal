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
            var isFormCompleted = false;
            var isDocumentCompleted = false;

            // search for forms
            for (var i in response.forms) {
                var action = response.actions[response.forms[i].action_id];
                actions.push(counter + ') Please complete "<a href="/member/form/?id=' + response.forms[i].id + '&planID='+ id +'">' + action.form_title + '</a>" form' + (response.forms[i].status ? ' (done)' : ''));
                counter++;

                if (!isFormCompleted && response.forms[i].status) {
                    isFormCompleted = true
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
                if (!isDocumentCompleted && response.document_count) {
                    isDocumentCompleted = true
                }
            }
            $onboardingContainer.html(tplOnboarding({
                current: response.current_state_number,
                total: response.total_state_number,
                actions: actions,
                isDocumentCompleted: isDocumentCompleted,
                isFormCompleted: isFormCompleted,
                isDocumentNeeded: isDocumentNeeded,
            }));

            $('#fileupload').fileupload({
                url: host + urlMap.document + id,
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
            url: host + urlMap.document + 'p/' + id,
            success: function (response) {
                $onboardingDocsContainer.html(tplOnboardingUploadedDocuments({
                    planID: id,
                    documents: response,
                    isDocumentNeeded: isDocumentNeeded,
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
            url: host + urlMap.document + 'p/' + planID + '/' + id ,
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
}



