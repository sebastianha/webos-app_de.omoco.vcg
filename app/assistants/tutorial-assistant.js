function TutorialAssistant() {

}

TutorialAssistant.prototype.setup = function() {
	this.appMenuModel = {
		visible: true,
		items: [
			{ label: $L("About"), command: 'about' },
			{ label: $L("Settings"), command: 'settings' }
		]
	};
	this.controller.setupWidget(Mojo.Menu.appMenu, {omitDefaultItems: true}, this.appMenuModel);
	
	this.controller.listen($('open_faq'),Mojo.Event.tap, this.faq.bind(this));
	this.controller.listen($('tutorial_close'),Mojo.Event.tap, this.close.bind(this));
}

TutorialAssistant.prototype.faq = function(event) {
	Mojo.Controller.stageController.pushScene("faq");
}

TutorialAssistant.prototype.close = function(event) {
	Mojo.Controller.stageController.popScene();
}

TutorialAssistant.prototype.activate = function(event) {

}

TutorialAssistant.prototype.deactivate = function(event) {

}

TutorialAssistant.prototype.cleanup = function(event) {

}

TutorialAssistant.prototype.handleCommand = function(event){
    if(event.type == Mojo.Event.command) {	
		switch (event.command) {
			case 'about':
				Mojo.Controller.stageController.pushScene("about");
				break;
			case 'settings':
				Mojo.Controller.stageController.pushScene("settings");
				break;
		}
	}
}