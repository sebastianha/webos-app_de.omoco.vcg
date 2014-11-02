function FaqAssistant() {

}

FaqAssistant.prototype.setup = function() {
	this.appMenuModel = {
		visible: true,
		items: [
			{ label: $L("About"), command: 'about' },
			{ label: $L("Settings"), command: 'settings' }
		]
	};
	this.controller.setupWidget(Mojo.Menu.appMenu, {omitDefaultItems: true}, this.appMenuModel);
}

FaqAssistant.prototype.activate = function(event) {

}

FaqAssistant.prototype.deactivate = function(event) {

}

FaqAssistant.prototype.cleanup = function(event) {

}

FaqAssistant.prototype.handleCommand = function(event){
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