function SettingsAssistant() {

}

SettingsAssistant.prototype.setup = function() {
	this.appMenuModel = {
		visible: true,
		items: []
	};
	this.controller.setupWidget(Mojo.Menu.appMenu, {omitDefaultItems: true}, this.appMenuModel);
	
	var upload_hs_attr = {
		hintText: '',
		textFieldName: 'name', 
		modelProperty: 'original', 
		multiline: false,
		focus: false, 
		maxLength: 20,
	};
	this.upload_hs_model = {
		'original' : OWNER,
		disabled: false
	};
	this.controller.setupWidget('settings_name_hs', upload_hs_attr, this.upload_hs_model);
	
	this.tattr = {trueLabel: $L("yes"), falseLabel: $L("no")};
	this.tModel = {value: UPLOADHS, disabled: false};
	this.controller.setupWidget('settings_upload_hs', this.tattr, this.tModel);
	
	this.tattrT = {trueLabel: $L("yes"), falseLabel: $L("no")};
	this.tModelT = {value: TWITTERHS, disabled: false};
	this.controller.setupWidget('settings_twitter_hs', this.tattrT, this.tModelT);
	
	this.tattrR = {trueLabel: $L("yes"), falseLabel: $L("no")};
	this.tModelR = {value: RESETSLIDER, disabled: false};
	this.controller.setupWidget('settings_reset_slider', this.tattrR, this.tModelR);
	
	this.tattrM = {trueValue: 'Mapnik', trueLabel: 'Mapnik', falseLabel: 'Osmarender', falseValue: 'Osmarender'};
	this.tModelM = {value: MAPTYPE, disabled: false};
	this.controller.setupWidget('settings_map_type', this.tattrM, this.tModelM);
	
	this.controller.listen($('settings_save'),Mojo.Event.tap, this.save.bind(this));
}

SettingsAssistant.prototype.save = function(event) {
	if(this.upload_hs_model['original'] == "") {
		Mojo.Controller.errorDialog($L("You have to enter a name!"));
		return -1;
	}
	
	var cookie = new Mojo.Model.Cookie("VCGSettings");
	cookie.put({
		owner: this.upload_hs_model['original'], 
		uploadhs: this.tModel.value,
		twitterhs: this.tModelT.value,
		resetslider: this.tModelR.value,
		maptype: this.tModelM.value,
	});
	
	VCGSettings = cookie.get();
	if(VCGSettings != null)	{
		OWNER = VCGSettings.owner;
		UPLOADHS = VCGSettings.uploadhs;
		TWITTERHS = VCGSettings.twitterhs;
		RESETSLIDER = VCGSettings.resetslider;
		MAPTYPE = VCGSettings.maptype;
	}
	
	Mojo.Controller.stageController.popScene();
}

SettingsAssistant.prototype.activate = function(event) {

}

SettingsAssistant.prototype.deactivate = function(event) {

}

SettingsAssistant.prototype.cleanup = function(event) {

}
