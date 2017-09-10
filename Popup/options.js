/// <reference path="../Include/index.d.ts"/>
/// <reference path="../Include/index2.d.ts"/>
var OptionsMessenger = (function () {
    function OptionsMessenger(manager) {
        this.m_Manager = manager;
        this.InitListeners();
    }
    OptionsMessenger.prototype.InitListeners = function () {
        this.m_Port = chrome.runtime.connect({ name: "options" });
        var self = this;
        this.m_Port.onMessage.addListener(function (msg, sender) {
            if (msg.Authenticated) {
                if (msg.Authenticated.val) {
                    self.m_Manager.SetupAuthenticated();
                }
                else {
                    $('#error-messages').text("Wrong Master-Password!");
                    self.m_Manager.ShowElement("error-messages");
                }
            }
            else if (msg.UserData) {
                self.m_Manager.SetupUserData(msg.UserData);
            }
        });
    };
    OptionsMessenger.prototype.PostMessage = function (input) {
        this.m_Port.postMessage(input);
    };
    return OptionsMessenger;
}());
var OptionsManager = (function () {
    function OptionsManager() {
        this.m_Messenger = new OptionsMessenger(this);
        this.InitListeners();
    }
    OptionsManager.prototype.InitListeners = function () {
        var self = this;
        $(document).ready(function () {
            $('#error-messages').hide();
            $('#data-table').hide();
            $('#change-masterpassword').hide();
            $('#auth-yes').hide();
            $('#unlocked').hide();
            $('#btn-authenticate').on("click", function () {
                var password = document.getElementById("master-password-input").value;
                if (password)
                    self.m_Messenger.PostMessage({ MasterPassword: password });
            });
            $('#btn-change').on("click", function () {
                var old_pw = $('#password-old-input').val();
                var new_pw = $('#password-new-input').val();
                var new_pw2 = $('#password-new-input2').val();
                if (!old_pw || !new_pw || !new_pw2) {
                    $('#error-messages').text("Please fill in all fields!");
                    return;
                }
                else if (new_pw != new_pw2) {
                    $('#error-messages').text("New Password inputs dont match");
                    return;
                }
            });
            $('#change-masterpassword-link').on("click", function () {
                $('#data-table').fadeOut(1500, function () {
                    $('#authentication').is(":visible") ?
                        $('#authentication').fadeOut(1500, function () { $('#change-masterpassword').show(); }) :
                        $('#data-table').fadeOut(1500, function () { $('#change-masterpassword').show(); });
                    $('#change-masterpassword').show();
                });
            });
            $(document).keyup(function (event) {
                if (event.keyCode == 13) {
                    $("#btn-authenticate").click();
                }
            });
        });
    };
    OptionsManager.prototype.ShowElement = function (id) {
        $("#" + id).show();
    };
    OptionsManager.prototype.HideElement = function (id) {
        $("#" + id).hide();
    };
    OptionsManager.prototype.SetupAuthenticated = function () {
        $('#error-messages').hide();
        $('#locked').hide();
        $('#unlocked').show();
        $('#authentication').fadeOut(1500, function () {
            $('#data-table').show();
        });
        $('#auth-no').hide();
        $('#auth-yes').show();
    };
    OptionsManager.prototype.SetupUserData = function (dataset) {
        console.info(dataset);
        var cnt = 0;
        for (var obj in dataset) {
            $('tbody').append('<tr>\
      						   <th scope="row">' + cnt + '</th>\
      						   <td>' + obj + '</td>\
                               <td>' + dataset[obj].Username + '</td>\
                               <td>' + dataset[obj].Password + '</td>\
                               </tr>');
            cnt++;
        }
    };
    return OptionsManager;
}());
var manager = new OptionsManager();
