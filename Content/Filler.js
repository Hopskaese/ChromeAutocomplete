// content-script which is injected into site

/*
port.onDisconnect.addListener((p) => {
  if (p.error) {
    console.log(`Disconnected due to an error: ${p.error.message}`);
  }
});
*/

var ClientMessenger = {
	m_Port: null,

	InitListeners: function() {
		m_Port = chrome.runtime.connect({name: "filler"});
		ClientMessenger.PostMessage({Domain: document.domain});

		m_Port.onMessage.addListener(function(msg, sender) {
			if (message.Credentials)
			{
				let user = message.Credentials[0];
				m_FormObject.password.value = user.password;
				m_FormObject.username.value = user.username;

				m_Form.submit();
			}
		});
	},
	PostMessage: function(json) {
		m_Port.postMessage(json);
	}
}

var Filler = {
	m_FormObject: null,
	m_Form: null,
	//messaging between content-script and extension
	InitFormObject: function() {
		var forms = document.forms;

		for (let i = 0; i < forms.length; i++) {
			var input_user = forms[i].querySelector('input[type="text"]');
			var input_email = forms[i].querySelector('input[type="email"]');
			var input_pw = forms[i].querySelector('input[type="password"]');

			if (input_user != null || input_email != null && input_pw != null)
			{
				m_Form = forms[i];
				m_FormObject = new Array();
				m_FormObject["username"] = input_user || input_email;
				m_FormObject["password"] = input_pw;

				break;
			}
		}
	},
}

ClientMessenger.InitListeners();
Filler.InitFormObject();


