/// <reference path="../Include/index.d.ts"/>
/// <reference path="../Include/index2.d.ts"/>
var States;
(function (States) {
    States[States["ST_NONE"] = 0] = "ST_NONE";
    States[States["ST_LOGIN"] = 1] = "ST_LOGIN";
    States[States["ST_CHANGEPW"] = 2] = "ST_CHANGEPW";
    States[States["ST_GENERALSETTINGS"] = 3] = "ST_GENERALSETTINGS";
})(States || (States = {}));
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
            else if (msg.ResetInput) {
                self.m_Manager.ChangeTextInputToTd(msg.ResetInput.val);
            }
            else if (msg.GenerateRandom) {
                self.m_Manager.SetTextInputValue(msg.GenerateRandom.id, msg.GenerateRandom.type, msg.GenerateRandom.val);
            }
            else if (msg.Frequency) {
                self.m_Manager.SetFrequency(msg.Frequency);
            }
            else if (msg.UpdatedUserData) {
                self.m_Manager.SetSuccess("Generalsettings updated");
                self.m_Manager.SetupUserData(msg.UpdatedUserData);
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
        this.m_Frequency = 0;
        this.m_State = States.ST_LOGIN;
    }
    OptionsManager.prototype.InitListeners = function () {
        var self = this;
        $(document).ready(function () {
            $('#btn-authenticate').on("click", function () {
                var password = $("#master-password-input").val();
                self.m_Password = password;
                if (password)
                    self.m_Messenger.PostMessage({ MasterPassword: password });
            });
            $('#btn-save-generalsettings').on("click", function () {
                var frequency = $('#frequency-select').val();
                if (frequency) {
                    self.SetFrequency(frequency);
                    $("#data-table-body").empty();
                    self.m_Messenger.PostMessage({ GeneralSettings: { Frequency: frequency, MasterPassword: self.m_Password } });
                }
                else {
                    self.SetError("Can obtain val from select element");
                }
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
            $("#btn-home").on("click", function () {
                if (self.m_State === States.ST_GENERALSETTINGS)
                    $('#general-settings').fadeOut(1500, function () {
                        $('#data-table').add('.data-table-row').show();
                        self.m_State = States.ST_NONE;
                    });
                else if (self.m_State === States.ST_CHANGEPW)
                    $('#change-masterpassword').fadeOut(1500, function () {
                        if (self.m_isAuthenticated) {
                            $('#data-table').add('.data-table-row').show();
                            self.m_State = States.ST_NONE;
                        }
                        else {
                            $('#authentication').show();
                            self.m_State = States.ST_LOGIN;
                        }
                    });
            });
            $('#change-masterpassword-link').on("click", function () {
                if ($('#general-settings').is(':visible'))
                    $('#general-settings').hide();
                self.m_isAuthenticated ?
                    $('#data-table').add('.data-table-row').fadeOut(1500, function () { $('#change-masterpassword').show(); }) :
                    $('#authentication').fadeOut(1500, function () { $('#change-masterpassword').show(); });
                self.m_State = States.ST_CHANGEPW;
            });
            $('#general-settings-link').on("click", function () {
                if (!self.m_isAuthenticated) {
                    self.SetError("You have to be logged in to change general settings!");
                    return;
                }
                if ($('#change-masterpassword').is(':visible'))
                    $('#change-masterpassword').hide();
                $('#data-table').add('.data-table-row').fadeOut(1500, function () { $('#general-settings').show(); });
                self.m_State = States.ST_GENERALSETTINGS;
            });
            $('#data-table').on("click", '[id^=change]', function () {
                var id = $(this).attr("id");
                id = id.substr(6, id.length);
                $(this).hide();
                self.ChangeTdToTextInput(id);
            });
            $('#data-table').on("click", '[id^=save]', function () {
                var id = $(this).attr("id");
                id = id.substr(4, id.length);
                var new_username = $('#td-input-username' + id).val();
                var new_password = $('#td-input-password' + id).val();
                var domain = $('#td-domain' + id).text();
                if (new_username.length > 0 && new_password.length > 0)
                    self.m_Messenger.PostMessage({ ChangeUserData: { Domain: domain,
                            Username: new_username,
                            Password: new_password,
                            MasterPassword: self.m_Password,
                            Id: id } });
                else
                    self.SetError("Input fields cant be empty!");
            });
            $('#data-table').on("click", '[id^=generate-username]', function () {
                var id_element = $(this).attr("id");
                id_element = id_element.substr(17, id_element.length);
                self.m_Messenger.PostMessage({ GenerateRandom: { id: id_element, type: "username" } });
            });
            $('#data-table').on("click", '[id^=generate-password]', function () {
                var id_element = $(this).attr("id");
                id_element = id_element.substr(17, id_element.length);
                self.m_Messenger.PostMessage({ GenerateRandom: { id: id_element, type: "password" } });
            });
            $(document).keyup(function (event) {
                if (event.keyCode == 13) {
                    if (self.m_State === States.ST_LOGIN)
                        $("#btn-authenticate").click();
                    else if (self.m_State === States.ST_CHANGEPW)
                        $("#btn-change").click();
                    else if (self.m_State === States.ST_GENERALSETTINGS)
                        $("#btn-save-generalsettings").click();
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
        if (username.indexOf("@") == -1)
            td_username.append('<button type="button" class="btn btn-sm btn-primary" style="margin-right:2%" id="generate-username' + id + '">Generate</button');
        td_password.append('<button type="button" class="btn btn-sm btn-primary" style="margin-right:2%" id="generate-password' + id + '">Generate</button');
        td_username.append('<input type="text" id="td-input-username' + id + '" value="' + username + '">');
        td_password.append('<input type="text" id="td-input-password' + id + '"value="' + password + '">');
        td_button.append('<button type="button" class="btn btn-sm btn-primary" id="save' + id + '">Save</button');
    };
    OptionsManager.prototype.ChangeTextInputToTd = function (id) {
        var input_username = $('#td-input-username' + id);
        var input_password = $('#td-input-password' + id);
        var button_save = $('#save' + id);
        var button_generate_username = $('#generate-username' + id);
        var button_generate_password = $('#generate-password' + id);
        var username = input_username.val();
        var password = input_password.val();
        input_username.remove();
        input_password.remove();
        button_generate_password.remove();
        button_generate_username.remove();
        button_save.remove();
        $('#td-username' + id).text(username);
        $('#td-password' + id).text(password);
        $('#td-button' + id).append('<button type="button" class="btn btn-sm btn-primary" id="change' + id + '">Change</button>');
    };
    OptionsManager.prototype.SetTextInputValue = function (id, type, value) {
        if (type == "username")
            $('#td-input-username' + id).val(value);
        else if (type == "password")
            $('#td-input-password' + id).val(value);
    };
    OptionsManager.prototype.SetFrequency = function (frequency) {
        this.m_Frequency = frequency;
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
        this.m_State = States.ST_NONE;
    };
    OptionsManager.prototype.SetError = function (error) {
        $('#error-message').text(error);
        $('#error-messages').show();
        $('#error-messages').fadeOut(3000);
    };
    OptionsManager.prototype.SetSuccess = function (success) {
        $('#success-message').text(success);
        $('#success-messages').show();
        $('#success-messages').fadeOut(3000);
    };
    OptionsManager.prototype.SetupUserData = function (dataset) {
        var cnt = 0;
        var date = new Date();
        var time = date.getTime();
        var time_left = 0;
        var time_string = "";
        for (var obj in dataset) {
            time_left = (time - dataset[obj].LastChanged) / 1000 / 60 / 60 / 24;
            time_left = this.m_Frequency - time_left;
            if ((time_left / 30) == 1)
                time_string = "1 Month";
            else if (time_left / 7 > 1)
                time_string = "" + Math.floor(time_left / 7) + " weeks and " + Math.floor(time_left % 7) + " days";
            else
                time_string = "" + Math.floor(time_left) + " days";
            $('#data-table-body').append('<tr class="data-table-row">\
      						   <th scope="row">' + cnt + '</th>\
      						   <td id="td-domain' + cnt + '">' + obj + '</td>\
                     <td id="td-username' + cnt + '">' + dataset[obj].Username + '</td>\
                     <td id="td-password' + cnt + '">' + dataset[obj].Password + '</td>\
                     <td id="td-button' + cnt + '"><button type="button" class="btn btn-sm btn-primary" id="change' + cnt + '">Change</button></td>\
                     <td id="td-deadline' + cnt + '">' + time_string + '</td>\
                     </tr>');
            if (time_left < 0)
                $('#td-deadline' + cnt).css("color", "#ff0000");
            cnt++;
        }
    };
    return OptionsManager;
}());
var manager = new OptionsManager();
