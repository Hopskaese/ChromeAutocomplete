/// <reference path="../Include/index.d.ts"/>
/// <reference path="cryptor.ts"/>
///  <reference path="model.ts" />
var ServerMessenger = (function () {
    function ServerMessenger() {
        this.m_Model = new Model();
        this.m_Cryptor = new Cryptor();
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
                self.InitPopupListener(port);
                var doesExist_1 = false;
                if (self.m_Domain) {
                    var dataset = self.m_Model.GetUserData(self.m_Domain, function (dataset) {
                        console.log("Returned data:" + dataset);
                        if (dataset)
                            doesExist_1 = true;
                        self.m_Port["popup"].postMessage({ DomainExists: { val: doesExist_1 } });
                    });
                }
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
                console.log("going to encrypt masterpassword" + msg.MasterPassword);
                self.m_Cryptor.Encrypt("sadasdas", msg.MasterPassword);
                //self.m_Port["filler"].postMessage({Userdata : self.m_Model.GetCurDataset()})
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
var messenger = new ServerMessenger();
