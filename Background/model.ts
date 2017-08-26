//chrome.storage.local.get(null, function (data) { console.info(data) });
/// <reference path="../Include/index.d.ts"/>
class Model {
	private m_CurDataset: object;
	constructor(){}
	SaveUserData(domain:string, username:string, password:string):void {
		let credentials = {"Username": username, "Password": password};
		chrome.storage.local.set({[domain] : credentials}, function() {
			let lasterror = chrome.runtime.lastError;
			if (lasterror)
				console.log("Last error" + lasterror.message);
		});
	}
	GetUserData(domain:string, callback:(data:object)=>any): void {
		let self = this;
		console.log("Trying to get data for:" + domain);
		chrome.storage.local.get([domain], function(dataset) {
			console.log(dataset);
			let lasterror = chrome.runtime.lastError;
			if (lasterror)
			{
				console.log("Error retrieving value from storage" + lasterror.message);
				callback(null);
				return;
			}
			else if (Object.keys(dataset).length == 0) 
			{
				console.log("record does not exist");
				callback(null);
				return;
			}
			console.log("Found record. Returning");
			self.m_CurDataset = dataset;
			callback(dataset);
		});
	}
	SaveMainData(hash:string, salt:string, iv:string):void {
		let data = {"Hash": hash, "Salt":salt, "Iv":iv};
		chrome.storage.local.set({MainData : data}, function() {
			let lasterror = chrome.runtime.lastError;
			if (lasterror)
				console.log("Last error" + lasterror.message);

			console.log("Main data has been saved");
		});
	}
	GetMainData(callback:(MainData:object)=>any): void {
		chrome.storage.local.get("MainData", function(dataset) {
			let lasterror = chrome.runtime.lastError;
			if (lasterror)
			{
				console.log("Error retrieving value from storage" + lasterror.message);
				callback(null);
				return;
			}
			else if (Object.keys(dataset).length == 0) 
			{
				console.log("record does not exist");
				callback(null);
				return;
			}
			console.log("Found record. Returning");
			callback(dataset);
		});
	}
	Authenticate(PasswordHash:string, callback:(result:boolean)=>void):void
	{
		chrome.storage.local.get("MainData", function(dataset) {
			let lasterror = chrome.runtime.lastError;
			if (lasterror)
			{
				console.log("Error retrieving value from storage" + lasterror.message);
				callback(false);
				return;
			}
			else if (Object.keys(dataset).length == 0) 
			{
				console.log("record does not exist");
				callback(false);
				return;
			}
			else if (!(dataset.MainData.hash == PasswordHash))
			{
				callback(false);
				return;
			}

			console.log("Found record. Returning");
			callback(true);
		});
	}
	GetCurDataset(): any {
		return this.m_CurDataset;
	}
}

