//chrome.storage.local.get(null, function (data) { console.info(data) });
/// <reference path="../Include/index.d.ts"/>
class Model {
	private m_CurDataset: object;
	constructor()
	{
		this.m_CurDataset = null;
	}
	SaveUserData(domain:string, username:string, password:string, lastchanged: number,
		success_callback:()=>any, error_callback:()=>any):void {
		let credentials = {"Username": username, "Password": password, "LastChanged": lastchanged};
		chrome.storage.local.set({[domain] : credentials}, function() {
			let lasterror = chrome.runtime.lastError;
			if (lasterror)
			{
				console.log("Error while trying to save UserData: " + lasterror.message);
				error_callback();
			}
		});
		success_callback();
		console.log("Userdata has been saved");
	}
	SaveMainData(hash:string, salt:string, iv:string,
		success_callback:()=>any, error_callback:()=>any):void {
		let data = {"Hash": hash, "Salt":salt, "Iv":iv};
		chrome.storage.local.set({MainData : data}, function() {
			let lasterror = chrome.runtime.lastError;
			if (lasterror)
			{
				console.log("Last error" + lasterror.message);
				error_callback();
			}
			success_callback();
			console.log("Main data has been saved");
		});
	}
	SaveGeneralSettings(frequency:number = 30,
		success_callback:()=>any, error_callback:()=>any)
	{
		let data = {"Frequency": frequency};
		chrome.storage.local.set({GeneralSettings: data}, function() {
			let lasterror = chrome.runtime.lastError;
			if (lasterror)
			{
				console.log("Last error" + lasterror.message);
				error_callback();
			}
			success_callback();
			console.log("GeneralSettings have been saved");
		});
	}
	DeleteRecord(domain:string,
		success_callback:()=>any, error_callback:()=>any):void {
		chrome.storage.local.remove([domain], function() {
			let lasterror = chrome.runtime.lastError;
			if (lasterror)
			{
				console.log("Error deleting record" + lasterror.message);
				error_callback();
			}
			console.log("key has been deleted");
			success_callback();
		});
	}
	GetAllUserData(success_callback:(MainData:object)=>any, error_callback:()=>any): void {
		chrome.storage.local.get(null, function(dataset:any) {
			let lasterror = chrome.runtime.lastError;
			if (lasterror)
			{
				console.log("Error retrieving value from storage" + lasterror.message);
				error_callback();
				return;
			}
			else if (Object.keys(dataset).length == 0) 
			{
				console.log("Could not find any records");
				error_callback();
				return;
			}
			for (let key in dataset)
				if (key == "MainData" || key == "GeneralSettings")
					delete dataset[key];

			success_callback(dataset);
		});
	}
	GetUserData(domain:string, success_callback:(MainData:object)=>any, error_callback:()=>any): void {
		let self = this;
		console.log("Trying to get data for: " + domain);
		chrome.storage.local.get([domain], function(dataset:any) {
			console.log(dataset);
			let lasterror = chrome.runtime.lastError;
			if (lasterror)
			{
				console.log("Error retrieving value from storage" + lasterror.message);
				error_callback();
				return;
			}
			else if (Object.keys(dataset).length == 0) 
			{
				console.log("record does not exist");
				error_callback();
				return;
			}
			console.log("Found record. Returning");
			self.m_CurDataset = dataset[domain];
			success_callback(dataset[domain]);
		});
	}
	GetMainData(success_callback:(MainData:object)=>any, error_callback:()=>any): void {
		chrome.storage.local.get("MainData", function(dataset) {
			let lasterror = chrome.runtime.lastError;
			if (lasterror)
			{
				console.log("Error retrieving value from storage" + lasterror.message);
				error_callback();
				return;
			}
			else if (Object.keys(dataset).length == 0) 
			{
				console.log("record does not exist");
				error_callback();
				return;
			}
			success_callback(dataset);
		});
	}
	GetGeneralSettings(success_callback:(MainData:object)=>any, error_callback:()=>any):void {
		chrome.storage.local.get("GeneralSettings", function(dataset) {
			let lasterror = chrome.runtime.lastError;
			if (lasterror)
			{
				console.log("Error retrieving value from storage" + lasterror.message);
				error_callback();
				return;
			}
			else if (Object.keys(dataset).length == 0) 
			{
				console.log("record does not exist");
				error_callback();
				return;
			}
			success_callback(dataset);
		});
	}
}

