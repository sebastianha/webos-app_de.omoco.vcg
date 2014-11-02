function WelcomeAssistant() {

}

WelcomeAssistant.prototype.setup = function() {
	this.controller.serviceRequest('palm://com.palm.location', {
		method:"startTracking",
		parameters:{
			subscribe: true
		},
		onSuccess: onSuccessGPS,
		onFailure: onFailureGPS
	});
	
	this.appMenuModel = {
		visible: true,
		items: [
			{ label: $L("About"), command: 'about' },
			{ label: $L("Settings"), command: 'settings' },
			{ label: $L("Tutorial"), command: 'tutorial' },
			{ label: $L("FAQ's"), command: 'faq' }
		]
	};
	this.controller.setupWidget(Mojo.Menu.appMenu, {omitDefaultItems: true}, this.appMenuModel);
	
	this.controller.listen($('help'),Mojo.Event.tap, this.help.bind(this));
	this.controller.listen($('random_course'),Mojo.Event.tap, this.randomCourse.bind(this));
	this.controller.listen($('download_course'),Mojo.Event.tap, this.downloadCourse.bind(this));
	this.controller.listen($('create_course'),Mojo.Event.tap, this.newCourse.bind(this));

	AdMob.ad.initialize({
		pub_id: 'a14ccbee4ece97a',
		bg_color: '#ccc',
		text_color: '#333',
		test_mode: false
	});
	
	AdMob.ad.request({
		onSuccess: (function (ad) {
			this.controller.get('admob_ad').insert(ad);
		}).bind(this),
		onFailure: (function () {}).bind(this),
	});
	
	var url = "http://omoco.de/vcgs/info.txt";
	var request = new Ajax.Request(url, {
		method: 'get',
		evalJSON: 'false',
		onSuccess: this.requestSuccess.bind(this),
		onFailure: this.requestFailure.bind(this)
	});
}

WelcomeAssistant.prototype.requestSuccess = function(resp){
	if(resp.responseText != "")
		this.showDialogBox($L("Message"), resp.responseText);
}

WelcomeAssistant.prototype.requestFailure = function(resp){
}

WelcomeAssistant.prototype.help = function(event){
	Mojo.Controller.stageController.pushScene("tutorial");
}

WelcomeAssistant.prototype.randomCourse = function(event){
	Mojo.Controller.stageController.pushScene("courserandom");
}

WelcomeAssistant.prototype.downloadCourse = function(event){
	Mojo.Controller.stageController.pushScene("courseselector");
}

WelcomeAssistant.prototype.newCourse = function(event){
	Mojo.Controller.stageController.pushScene("coursecreate");
}

WelcomeAssistant.prototype.activate = function(event) {

}

WelcomeAssistant.prototype.deactivate = function(event) {

}

WelcomeAssistant.prototype.cleanup = function(event) {

}

WelcomeAssistant.prototype.showDialogBox = function(title,message) {
	this.controller.showAlertDialog({
		onChoose: function(value) {},
		title:title,
		message:message,
		allowHTMLMessage: true,
		choices:[ {label:'OK', value:'OK', type:'color'} ]
	});
}

WelcomeAssistant.prototype.handleCommand = function(event){
    if(event.type == Mojo.Event.command) {	
		switch (event.command) {
			case 'about':
				Mojo.Controller.stageController.pushScene("about");
				break;
			case 'settings':
				Mojo.Controller.stageController.pushScene("settings");
				break;
			case 'tutorial':
				Mojo.Controller.stageController.pushScene("tutorial");
				break;
			case 'faq':
				Mojo.Controller.stageController.pushScene("faq");
				break;
		}
	}
}