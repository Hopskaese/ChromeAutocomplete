//chrome.storage.local.get(null, function (data) { console.info(data) });
/// <reference path="../Include/index.d.ts"/>
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
    Model.prototype.GetUserData = function (domain, callback) {
        var self = this;
        console.log("Trying to get data for:" + domain);
        chrome.storage.local.get([domain], function (dataset) {
            console.log(dataset);
            var lasterror = chrome.runtime.lastError;
            if (lasterror) {
                console.log("Error retrieving value from storage" + lasterror.message);
                callback(null);
            }
            else if (Object.keys(dataset).length == 0) {
                console.log("record does not exist");
                callback(null);
            }
            console.log("Found record. Returning");
            self.m_CurDataset = dataset;
            callback(dataset);
        });
    };
    Model.prototype.GetCurDataset = function () {
        return this.m_CurDataset;
    };
    Model.prototype.Authenticate = function (password) {
    };
    return Model;
}());
