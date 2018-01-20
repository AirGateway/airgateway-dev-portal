


/******************/
/* CHAT HANDLERS */
/******************/

$chatContainer = $('#chat-panel');
$chatMessagesContainer = $('.chat__messages');
var emailForChat;
var files = [];
var chatID;
var messages = [];

if ($chatContainer.length) {
    var tplChatMessages = underscore.template($('#tpl_chat_messages').html());
    var tplChatFiles = underscore.template($('#tpl_chat_files').html());

    $('#fileupload').fileupload({
        url: host + urlMap.document,
        headers: {
            'Ag-Auth-Dev': localStorage.token
        },
        paramName: 'file',
        sequentialUploads: true,
        autoUpload: false,
        add: function (e, data) {
            can = true;
            files.map(function (item) {
                if (item.name == data.files[0].name) {
                    can = false;
                }
            });
            if (can) {
                files.push(data.files[0]);
                renderChatFiles();
            }
        },
        done: function (e, data) {
            files = [];
            renderChatFiles();
            loadMessages();
        }
    });

    $.signedAjax({
        url: host + urlMap.profile,
        success: function (response) {
            emailForChat = response.data.email;
        },
        error: function (result) {
            if (result.status == 401) {
                $('#logout').click();
            }
        }
    });

    loadMessages();

    setInterval(function () {
        loadMessages()
    }, 10000);

    function prepareMessagesForRender(messages) {
        var messagesForRender = [];

        var dMMMM = Intl.DateTimeFormat('en-GB', {month: 'long', day: 'numeric'});
        var HHmm = Intl.DateTimeFormat('en-GB', {hour: 'numeric', minute: 'numeric'});
        var dMy = Intl.DateTimeFormat('en-GB', {year: 'numeric', month: 'numeric', day: 'numeric'});

        var todayDate = dMMMM.format(new Date());
        var yesterdayDate = dMMMM.format(new Date().getDate() - 1);

        var lastDate;
        messages.map(function (item) {
            var author;
            if (item.by_user) {
                author = 'Airline';
            } else {
                author = emailForChat;
            }
            var text = item.text;
            var type = item.type;
            var document_id = item.document_id;
            var date = dMy.format(new Date(item.date_created));
            var time = HHmm.format(new Date(item.date_created));


            if (!lastDate || lastDate != date) {
                var itemDate = dMMMM.format(new Date(item.date_created));
                var dateTitle;

                if (itemDate == todayDate) {
                    dateTitle = 'Today'
                } else if (itemDate == yesterdayDate) {
                    dateTitle = 'Yesterday';
                } else {
                    dateTitle = itemDate;
                }

                messagesForRender.push({
                    date: dateTitle
                });

                lastDate = date;
            }

            var object = {
                author: author,
                time: time,
                text: text,
                type: type,
                document_id: document_id,
            };

            messagesForRender.push(object);
        });

        return messagesForRender;
    }
}
$(document).on('click','.form-from-chat', function(e) {
    e.preventDefault();

    location.href = '/member/form/?id='+$(this).data('id')
});

$(document).on('keydown', '#textbox', function (e) {
    if (e.keyCode == 13 && (e.ctrlKey || e.metaKey)) {
        createMessage()
    }
});

function loadMessages() {
    $.signedAjax({
        url: host + urlMap.chat,
        success: function (response) {
            messages = response.messages;
            chatID = response.chat.id;

            renderMessages()
        },
        error: function (result) {
            if (result.status == 401) {
                $('#logout').click();
            }
        }
    });
}

function renderMessages() {
    $chatMessagesContainer.html('');
    var messagesForRender = prepareMessagesForRender(messages);

    for (var i in messagesForRender) {
        $chatMessagesContainer.append(tplChatMessages({message: messagesForRender[i]}));
    }

    $chatMessagesContainer[0].scrollTop = $chatMessagesContainer[0].scrollHeight;
}
/*

function renderChatFiles() {
    $('#fileitem-queue').html(tplChatFiles({
        files: files
    }))
}
*/

/*
function removeItemFromQueue(i) {
    renderChatFiles();
}
*/

function createMessage() {
    var $textbox = $('#textbox');
    var text = $textbox.val().trim();
    $textbox.val('');
    if (!text) {
        //uploadQueuedFiles();

        return
    }

    var cm = {
        chat_id: chatID,
        text: text,
    };
    $.signedAjax({
        method: 'POST',
        url: host + urlMap.chat,
        data: JSON.stringify(cm),
        success: function (response) {
            messages.push(response.chat_message);
            renderMessages();
        },
        error: function (result) {
            if (result.status == 401) {
                $('#logout').click();
            }
        }
    });

    $textbox.focus();
    //uploadQueuedFiles();
}

/*
function uploadQueuedFiles() {
    $('#fileupload').fileupload('send', {files: files});
}*/
