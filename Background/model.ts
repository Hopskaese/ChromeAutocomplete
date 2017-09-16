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
		console.log("Userdata has been saved");
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
	SaveGeneralSettings(frequency:number)
	{
		chrome.storage.local.set({GeneralSettings: frequency}, function() {
			let lasterror = chrome.runtime.lastError;
			if (lasterror)
				console.log("Last error" + lasterror.message);

			console.log("Main data has been saved");
		});
	}
	DeleteRecord(domain:string, callback:()=>any):void {
		chrome.storage.local.remove([domain], function() {
			let lasterror = chrome.runtime.lastError;
			if (lasterror)
			{
				console.log("Error deleting record" + lasterror.message);
				return;
			}
			console.log("key has been deleted");
			callback();
		});
	}
	GetAllUserData(callback:(data:object)=>any): void {
		chrome.storage.local.get(null, function(dataset:any) {
			let lasterror = chrome.runtime.lastError;
			if (lasterror)
			{
				console.log("Error retrieving value from storage" + lasterror.message);
				return;
			}
			else if (Object.keys(dataset).length == 0) 
			{
				console.log("Could not find any records");
				return;
			}
			for (let key in dataset)
				if (key == "MainData")
					delete dataset[key];

			callback(dataset);
		});
	}
	GetUserData(domain:string, callback:(data:object)=>any): void {
		let self = this;
		console.log("Trying to get data for: " + domain);
		chrome.storage.local.get([domain], function(dataset:any) {
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
			self.m_CurDataset = dataset[domain];
			callback(dataset[domain]);
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
			callback(dataset);
		});
	}
	GetCurDataset(): any {
		return this.m_CurDataset;
	}
}

