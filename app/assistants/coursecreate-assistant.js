function CoursecreateAssistant() {
	this.lon = 99999.0;
	this.lat = 99999.0;
	this.holeLon = 99999.0;
	this.holeLat = 99999.0;
	this.ballLon = 99999.0;
	this.ballLat = 99999.0;
	this.accuracy = 99999.0;
}

CoursecreateAssistant.prototype.setup = function() {
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
	
	this.spinnerLAttrs = {spinnerSize: 'large'};
	this.spinnerModel = {spinning: false};
	this.controller.setupWidget('waiting_spinner', this.spinnerLAttrs, this.spinnerModel);
	
	this.controller.listen($('set_hole'),Mojo.Event.tap, this.setHole.bind(this));
	this.controller.listen($('set_ball'),Mojo.Event.tap, this.setBall.bind(this));
	this.controller.listen($('save'),Mojo.Event.tap, this.save.bind(this));
	
	var course_name_attributes = {
		hintText: '',
		textFieldName: 'name', 
		modelProperty: 'original', 
		multiline: false,
		focus: false, 
		maxLength: 20,
	};
	this.course_name_model = {
		'original' : '',
		disabled: false
	};
	this.controller.setupWidget('course_name', course_name_attributes, this.course_name_model);
	
	var course_creator_attributes = {
		hintText: '',
		textFieldName: 'name', 
		modelProperty: 'original', 
		multiline: false,
		focus: false, 
		maxLength: 20,
	};
	this.course_creator_model = {
		'original' : OWNER,
		disabled: false
	};
	this.controller.setupWidget('course_creator', course_creator_attributes, this.course_creator_model);
	
	var course_info_attributes = {
		hintText: '',
		textFieldName: 'name', 
		modelProperty: 'original', 
		multiline: false,
		focus: false, 
		maxLength: 200,
	};
	this.course_info_model = {
		'original' : '',
		disabled: false
	};
	this.controller.setupWidget('course_info', course_info_attributes, this.course_info_model);
	
	this.tattr = {trueLabel: $L("allow"), falseLabel: $L("forbid")};
	this.tModel = {value: true, disabled: false};
	this.tattra = {trueLabel: $L("allow"), falseLabel:  $L("forbid")};
	this.tModela = {value: true, disabled: false};
	
	this.controller.setupWidget('shoot_normal_t', this.tattr, this.tModel);
	this.controller.setupWidget('shoot_accel_t', this.tattra, this.tModela);

	registerGpsCallback(this.onSuccessGPS.bind(this));
	
	this.minAccuracy = 36.0;
	
	// GPS HACK
	if(GPSHACK == 51) {
		this.minAccuracy = 51.0;
	}
}

CoursecreateAssistant.prototype.onSuccessGPS = function(event){
	var accuracy = this.getAccuracy(event.horizAccuracy, event.vertAccuracy);
	this.accuracy = accuracy;
	this.lon = event.longitude;
	this.lat = event.latitude;
	
	var courseDistance = -1;
	
	if (this.holeLon != 99999.0 && this.holeLat != 99999.0 && this.ballLon != 99999.0 && this.ballLat != 99999.0) {
		var p1 = new OpenLayers.LonLat(this.holeLon, this.holeLat);
		var p2 = new OpenLayers.LonLat(this.ballLon, this.ballLat);
		courseDistance = Math.round(OpenLayers.Util.distVincenty(p1, p2)*1000.0);
	}
	$('gps_info').innerHTML = "<center>" + $L("Actual Position and Accuracy:") + "<br>" + (Math.round(this.lon*1000000.0)/1000000.0) + " / " + (Math.round(this.lat*1000000.0)/1000000.0) + " / " + this.accuracy + "m<br>" + $L("Distance Hole-Ball: ") + courseDistance + "m</center>"; 
}

CoursecreateAssistant.prototype.setHole = function(event){
	if(this.accuracy > this.minAccuracy) {
		Mojo.Controller.errorDialog($L("Accuracy must be lower than ") + (this.minAccuracy-1) + "m!");
		return -1;
	}
	
	this.holeLon = this.lon;
	this.holeLat = this.lat;
	
	$(hole_pos).innerHTML = "<center>" + (Math.round(this.holeLon*1000000.0)/1000000.0) + " / " + (Math.round(this.holeLat*1000000.0)/1000000.0) + "</center>";
}

CoursecreateAssistant.prototype.setBall = function(event){
	if(this.accuracy > this.minAccuracy) {
		Mojo.Controller.errorDialog($L("Accuracy must be lower than ") + (this.minAccuracy-1) + "m!");
		return -1;
	}
	
	this.ballLon = this.lon;
	this.ballLat = this.lat;
	
	$(ball_pos).innerHTML = "<center>" + (Math.round(this.ballLon*1000000.0)/1000000.0) + " / " + (Math.round(this.ballLat*1000000.0)/1000000.0) + "</center>";
}

CoursecreateAssistant.prototype.save = function(event){
	if(this.holeLon == 99999.0 || this.holeLat == 99999.0) {
		Mojo.Controller.errorDialog($L("Hole position not set!"));
		return -1;
	}
	if(this.ballLon == 99999.0 || this.ballLat == 99999.0) {
		Mojo.Controller.errorDialog($L("Ball position not set!"));
		return -1;
	}
	
	var courseDistance = -1;
	
	var p1 = new OpenLayers.LonLat(this.holeLon, this.holeLat);
	var p2 = new OpenLayers.LonLat(this.ballLon, this.ballLat);
	courseDistance = Math.round(OpenLayers.Util.distVincenty(p1, p2)*1000.0);
	if(courseDistance < 25.0) {
		Mojo.Controller.errorDialog($L("The distance between ball and hole has to be greater than 25m!"));
		return -1;
	}
	
	if(this.course_name_model['original'] == "") {
		Mojo.Controller.errorDialog($L("You have to set a name for the course!"));
		return -1;
	}

	if(this.course_creator_model['original'] == "") {
		Mojo.Controller.errorDialog($L("You have to set a creator for the course!"));
		return -1;
	}
	
	if(this.course_info_model['original'] == "") {
		Mojo.Controller.errorDialog($L("You have to set the information text for the course!"));
		return -1;
	}
	
	if(this.tModel.value == false && this.tModela.value == false) {
		Mojo.Controller.errorDialog($L("You have to allow at least one stroke type!"));
		return -1;
	}
	
	var holeLon = this.holeLon;
	var holeLat = this.holeLat;
	var ballLon = this.ballLon;
	var ballLat = this.ballLat;
	var name = this.course_name_model['original'];
	var creator = this.course_creator_model['original'];
	var info = this.course_info_model['original'];
	
	var shoot = 0;
	if(this.tModel.value == false)
		shoot = 2;
	if(this.tModela.value == false)
		shoot = 1;
	if(this.tModel.value == false && this.tModela.value == false)
		shoot = 0;

	
	this.spinnerModel.spinning = true;
	this.controller.modelChanged(this.spinnerModel);
	$('waiting_spinner2').style.display = "block";
	
	var url = "http://vcgs.omoco.de/vcgs/createcourse.php?holelon=" + holeLon + "&holelat=" + holeLat + "&balllon=" + ballLon + "&balllat=" + ballLat + "&name=" + name + "&creator=" + creator + "&info=" + info + "&shoot=" + shoot + "&type=2&setball=0";
	var request = new Ajax.Request(url, {
		method: 'get',
		evalJSON: 'force',
		onSuccess: this.uploadCourseSuccess.bind(this),
		onFailure: this.uploadCourseFailure.bind(this)
	});
}

CoursecreateAssistant.prototype.uploadCourseSuccess = function(event){
	if (event.responseText != "OK") {
		Mojo.Controller.errorDialog($L("Could not create the course!"));
		return -1;
	}
	
	unRegisterGpsCallback();
	Mojo.Controller.stageController.swapScene("courseselector");
}

CoursecreateAssistant.prototype.uploadCourseFailure = function(event){
	this.spinnerModel.spinning = false;
	this.controller.modelChanged(this.spinnerModel);
	$('waiting_spinner2').style.display = "none";
	
	Mojo.Controller.errorDialog($L("Could not upload the course!"));
}

CoursecreateAssistant.prototype.activate = function(event) {
	Mojo.Controller.stageController.setWindowProperties({ blockScreenTimeout: true });
}

CoursecreateAssistant.prototype.deactivate = function(event) {

}

CoursecreateAssistant.prototype.cleanup = function(event) {
	unRegisterGpsCallback();
}

CoursecreateAssistant.prototype.getAccuracy = function(hori, vert) {
	if(hori > vert)
		return Math.round(hori);
	else
		return Math.round(vert);
}

CoursecreateAssistant.prototype.handleCommand = function(event){
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