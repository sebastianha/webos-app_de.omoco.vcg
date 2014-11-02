function AboutAssistant() {

}

AboutAssistant.prototype.setup = function() {
	this.appMenuModel = {
		visible: true,
		items: []
	};
	this.controller.setupWidget(Mojo.Menu.appMenu, {omitDefaultItems: true}, this.appMenuModel);
	
	Mojo.Event.listen(this.controller.sceneElement, Mojo.Event.keydown, this.keypress.bind(this));
}

AboutAssistant.prototype.activate = function(event) {

}

AboutAssistant.prototype.deactivate = function(event) {

}

AboutAssistant.prototype.cleanup = function(event) {

}

AboutAssistant.prototype.keypress = function(event) {
	if(event.originalEvent.keyCode == 71) {
		Mojo.Controller.errorDialog("GPS hack activated. Please restart the app now! To deactivate the hack please deinstall and install the app.");	
		var cookie = new Mojo.Model.Cookie("VCGGpsHack");
		cookie.put({
			gpshack: 51
		});
	}
}
