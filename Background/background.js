/// <reference path="../Include/index.d.ts"/>
var ServerMessenger = (function () {
    function ServerMessenger() {
        this.m_Model = new Model();
        this.m_Port = {};
        this.InitListeners();
    }
    ServerMessenger.prototype.InitListeners = function () {
        var self = this;
        chrome.runtime.onConnect.addListener(function (port) {
            self.m_Port[port.name] = port;
            if (port.name == "filler") {
                console.log("filler connected");
                self.InitFillerListener(port);
            }
            else if (port.name == "popup") {
                console.log("popup connected");
                var doesExist = false;
                if (self.m_Domain) {
                    var dataset = self.m_Model.GetUserData(self.m_Domain);
                    if (dataset)
                        doesExist = true;
                }
                self.InitPopupListener(port);
                self.m_Port["popup"].postMessage({ DomainExists: { val: doesExist } });
            }
        });
    };
    ServerMessenger.prototype.InitFillerListener = function (port) {
        var self = this;
        port.onMessage.addListener(function (msg) {
            if (msg.Domain) {
                self.m_Domain = msg.Domain;
            }
        });
    };
    ServerMessenger.prototype.InitPopupListener = function (port) {
        var self = this;
        port.onMessage.addListener(function (msg) {
            console.log("Popup msg:" + msg.NewUserInfo);
            if (msg.NewUserInfo && self.m_Domain) {
                var user = msg.NewUserInfo;
                self.m_Model.SaveUserData(self.m_Domain, user.Username, user.Password);
            }
            else if (msg.MasterPassword) {
                /*
                Authenticate();
                let credentials = Model.GetUserData(m_Domain);
                m_Port["filler"].postMessage({"credentials" : credentials});
                
                var dataset = Model.GetUserData(m_Domain);
                if (dataset)
                    m_Port["filler"].postMessage({"Credentials" : credentials});
                else
                {}
                Implement general error class.
                */
            }
        });
    };
    return ServerMessenger;
}());
//chrome.storage.local.get(null, function (data) { console.info(data) });
var Model = (function () {
    function Model() {
    }
    Model.prototype.SaveUserData = function (domain, username, password) {
        var credentials = { "Username": username, "Password": password };
        chrome.storage.local.set((_a = {}, _a[domain] = credentials, _a), function () {
            var lasterror = chrome.runtime.lastError;
            if (lasterror)
                console.log("Last error" + lasterror.message);
        });
        var _a;
    };
    Model.prototype.GetUserData = function (domain) {
        console.log("Trying to get data for:" + domain);
        chrome.storage.local.get([domain], function (dataset) {
            console.info(dataset);
            var lasterror = chrome.runtime.lastError;
            if (lasterror) {
                console.log("Error retrieving value from storage" + lasterror.message);
                return null;
            }
            else if (typeof dataset.links == 'undefined') {
                console.log("record does not exist");
                return null;
            }
            console.log("Found record. Returning");
            return dataset;
        });
    };
    Model.prototype.Authenticate = function (password) {
    };
    return Model;
}());
var messenger = new ServerMessenger();
