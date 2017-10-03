/// <reference path="../Include/index.d.ts"/>
/// <reference path="../Include/index2.d.ts"/>
var States;
(function (States) {
    States[States["ST_NONE"] = 0] = "ST_NONE";
    States[States["ST_LOGIN"] = 1] = "ST_LOGIN";
    States[States["ST_CHANGEPW"] = 2] = "ST_CHANGEPW";
    States[States["ST_GENERALSETTINGS"] = 3] = "ST_GENERALSETTINGS";
    States[States["ST_MAINPAGE"] = 4] = "ST_MAINPAGE";
    States[States["ST_BACKUP"] = 5] = "ST_BACKUP";
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
                self.m_Manager.SetGenerated(msg.GenerateRandom.id, msg.GenerateRandom.type, msg.GenerateRandom.val);
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
        this.m_StateElements = {};
    }
    OptionsManager.prototype.InitListeners = function () {
        var self = this;
        $(document).ready(function () {
            self.m_StateElements[States.ST_MAINPAGE] = $("#data-table").add('.data-table-row');
            self.m_StateElements[States.ST_GENERALSETTINGS] = $("#general-settings");
            self.m_StateElements[States.ST_CHANGEPW] = $("#change-masterpassword");
            self.m_StateElements[States.ST_BACKUP] = $("#backup");
            self.m_StateElements[States.ST_LOGIN] = $("#authentication");
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
                if (!old_pw || !new_pw || !new_pw2)
                    self.SetError("Please fill in all fields!");
                else if (new_pw != new_pw2)
                    self.SetError("New Password inputs don't match!");
                else
                    self.m_Messenger.PostMessage({ ChangeMasterPassword: { OldPassword: old_pw, NewPassword: new_pw } });
            });
            $("#btn-home").on("click", function () {
                if (self.m_isAuthenticated) {
                    self.SetPageToState(States.ST_MAINPAGE);
                    self.SetState(States.ST_MAINPAGE);
                }
                else {
                    self.SetPageToState(States.ST_LOGIN);
                    self.SetState(States.ST_LOGIN);
                }
            });
            $('#change-masterpassword-link').on("click", function () {
                self.SetPageToState(States.ST_CHANGEPW);
                self.SetState(States.ST_CHANGEPW);
            });
            $('#general-settings-link').on("click", function () {
                if (!self.m_isAuthenticated) {
                    self.SetError("You have to be logged in to change general settings!");
                }
                else {
                    self.SetPageToState(States.ST_GENERALSETTINGS);
                    self.SetState(States.ST_GENERALSETTINGS);
                }
            });
            $('#load-backup-link').on("click", function () {
                self.SetPageToState(States.ST_BACKUP);
                self.SetState(States.ST_BACKUP);
            });
            $('#btn-download-backup').on("click", function () {
                self.m_Messenger.PostMessage({ CreateBackup: "placeholder" });
            });
            $('#btn-upload-backup').on("click", function () {
                var file;
                var fileReader;
                if (!(file = document.getElementById("backup-input").files[0]))
                    self.SetError("File input cant be empty!");
                else {
                    fileReader = new FileReader();
                    fileReader.onload = function () {
                        self.m_Messenger.PostMessage({ LoadBackup: fileReader.result });
                    };
                    fileReader.onerror = function (e) {
                        self.SetError(e.toString());
                    };
                    fileReader.readAsText(file);
                }
            });
            $('#data-table').on("click", '[id^=change]', function () {
                var id = $(this).attr("id");
                id = id.substr("change".length, id.length);
                $(this).hide();
                self.ChangeTdToTextInput(id);
            });
            $('#data-table').on("click", '[id^=save]', function () {
                var id = $(this).attr("id");
                id = id.substr("save".length, id.length);
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
                id_element = id_element.substr("generate-username".length, id_element.length);
                self.m_Messenger.PostMessage({ GenerateRandom: { id: id_element, type: "username" } });
            });
            $('#data-table').on("click", '[id^=generate-password]', function () {
                var id_element = $(this).attr("id");
                id_element = id_element.substr("generate-password".length, id_element.length);
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
    OptionsManager.prototype.SetGenerated = function (id, type, value) {
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
    OptionsManager.prototype.SetState = function (state) {
        this.m_State = state;
    };
    OptionsManager.prototype.SetupAuthenticated = function () {
        $('#locked').hide();
        $('#unlocked').show();
        $('#auth-no').hide();
        $('#auth-yes').show();
        this.SetPageToState(States.ST_MAINPAGE);
        this.SetState(States.ST_MAINPAGE);
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
    OptionsManager.prototype.SetPageToState = function (state) {
        if (this.m_State == state)
            return;
        var self = this;
        this.m_StateElements[this.m_State].fadeOut(1250, function () {
            self.m_StateElements[state].show();
        });
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
