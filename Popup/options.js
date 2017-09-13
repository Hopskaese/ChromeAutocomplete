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
                    self.m_Manager.SetAuthenticated();
                }
                else {
                    self.m_Manager.SetError("Wrong Master-Password!");
                }
            }
            else if (msg.UserData) {
                self.m_Manager.SetupUserData(msg.UserData);
            }
            else if (msg.Error) {
                self.m_Manager.SetError(msg.Error);
            }
            else if (msg.Success) {
                self.m_Manager.SetSuccess(msg.Success);
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
        this.m_isAuthenticated = false;
        this.m_Password = "";
    }
    OptionsManager.prototype.InitListeners = function () {
        var self = this;
        $(document).ready(function () {
            $('#error-messages').hide();
            $('#success-messages').hide();
            $('#data-table').hide();
            $('#change-masterpassword').hide();
            $('#auth-yes').hide();
            $('#unlocked').hide();
            $('#btn-authenticate').on("click", function () {
                var password = $("#master-password-input").val();
                self.m_Password = password;
                if (password)
                    self.m_Messenger.PostMessage({ MasterPassword: password });
            });
            $('#btn-change').on("click", function () {
                var old_pw = $('#password-old-input').val();
                var new_pw = $('#password-new-input').val();
                var new_pw2 = $('#password-new-input2').val();
                if (!old_pw || !new_pw || !new_pw2) {
                    self.SetError("Please fill in all fields!");
                }
                else if (new_pw != new_pw2) {
                    self.SetError("New Password inputs don't match!");
                }
                else {
                    self.m_Messenger.PostMessage({ ChangeMasterPassword: { OldPassword: old_pw, NewPassword: new_pw } });
                }
            });
            $('#change-masterpassword-link').on("click", function () {
                $('#data-table').fadeOut(1500, function () {
                    self.m_isAuthenticated ?
                        $('#data-table').fadeOut(1500, function () { $('#change-masterpassword').show(); }) :
                        $('#authentication').fadeOut(1500, function () { $('#change-masterpassword').show(); });
                    $('#change-masterpassword').show();
                });
            });
            $('#data-table').on("click", '[id^=change]', function () {
                var id = $(this).attr("id");
                id = id.substr(6);
                $(this).hide();
                self.ChangeTdToTextInput(id);
            });
            $('#data-table').on("click", '[id^=save]', function () {
                var id = $(this).attr("id");
                id = id.substr(4);
                var new_username = $('#td-input-username' + id).val();
                var new_password = $('#td-input-password' + id).val();
                var domain = $('#td-domain' + id).text();
                if (new_username.length > 0 && new_password.length > 0)
                    self.m_Messenger.PostMessage({ ChangeUserData: { Domain: domain,
                            Username: new_username,
                            Password: new_password,
                            MasterPassword: self.m_Password } });
                else
                    self.SetError("Input field cant be empty!");
            });
            $(document).keyup(function (event) {
                if (event.keyCode == 13) {
                    $("#btn-authenticate").click();
                }
            });
        });
    };
    OptionsManager.prototype.ChangeTdToTextInput = function (id) {
        var td_username = $('#td-username' + id);
        var td_password = $('#td-password' + id);
        var td_button = $('#td-button' + id);
        var username = td_username.text();
        td_username.text("");
        var password = td_password.text();
        td_password.text("");
        td_username.append('<input type="text" id="td-input-username' + id + '" value="' + username + '">');
        td_password.append('<input type="text" id="td-input-password' + id + '"value="' + password + '">');
        td_button.append('<button type="button" class="btn btn-sm btn-primary" id="save' + id + '">Save</button');
    };
    OptionsManager.prototype.SetError = function (error) {
        $('#error-message').text(error);
        $('#error-messages').show();
    };
    OptionsManager.prototype.SetSuccess = function (success) {
        $('#success-message').text(success);
        $('#success-messages').show();
    };
    OptionsManager.prototype.SetAuthenticated = function () {
        this.m_isAuthenticated = true;
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
        var cnt = 0;
        for (var obj in dataset) {
            $('tbody').append('<tr>\
      						   <th scope="row">' + cnt + '</th>\
      						   <td id="td-domain' + cnt + '">' + obj + '</td>\
                               <td id="td-username' + cnt + '">' + dataset[obj].Username + '</td>\
                               <td id="td-password' + cnt + '">' + dataset[obj].Password + '</td>\
                               <td id="td-button' + cnt + '"><button type="button" class="btn btn-sm btn-primary" id="change' + cnt + '">Change</button></td>\
                               </tr>');
            cnt++;
        }
    };
    return OptionsManager;
}());
var manager = new OptionsManager();
