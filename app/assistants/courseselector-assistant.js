function CourseselectorAssistant() {

}

CourseselectorAssistant.prototype.setup = function() {
	this.appMenuModel = {
		visible: true,
		items: [
			{ label: $L("About"), command: 'about' },
			{ label: $L("Settings"), command: 'settings' },
			{ label: $L("Tutorial"), command: 'tutorial' },
			{ label: $L("FAQ's"), command: 'faq' },
			{ label: $L("Refresh"), command: 'refresh' }
		]
	};
	this.controller.setupWidget(Mojo.Menu.appMenu, {omitDefaultItems: true}, this.appMenuModel);
	
	this.spinnerLAttrs = {spinnerSize: 'large'};
	this.spinnerModel = {spinning: false};
	this.controller.setupWidget('waiting_spinner', this.spinnerLAttrs, this.spinnerModel);
	
	this.courses = [];
	this.selectorsModel = { coursename: $L("Downloading courses...") };
	
	this.controller.listen('course_selector', Mojo.Event.propertyChange, this.courseSelectorChanged.bindAsEventListener(this));
	this.controller.setupWidget('course_selector', {label: $L("Course"), choices: this.courses, modelProperty:'coursename'}, this.selectorsModel);
	
	this.controller.listen($('download_course'),Mojo.Event.tap, this.downloadCourse.bind(this));
	
	this.gpstext = 0;
	this.swapGPSText.bind(this).delay(30);
	
	this.refresh();
}

CourseselectorAssistant.prototype.swapGPSText = function() {
	if (this.gpstext != 999) {
		if (this.gpstext == 0) {
			this.gpstext = 1;
			$('acc').innerHTML = "<center>" + $L("Please make sure that GPS is<br>activated and working properly!") + "</center>";
			this.swapGPSText.bind(this).delay(4);
		}
		else 
			if (this.gpstext == 1) {
				this.gpstext = 2;
				$('acc').innerHTML = "<center>" + $L("You have to be outside and under<br>clear sky to get a good fix!") + "</center>";
				this.swapGPSText.bind(this).delay(4);
			}
			else {
				this.gpstext = 0;
				this.swapGPSText.bind(this).delay(30);
			}
	}
}

CourseselectorAssistant.prototype.refresh = function() {
	this.coursesDownloaded = false;
	this.gotholes = false;
	this.gotballs = false;
	this.courses = [];
	this.selectorsModel.coursename = $L("Downloading courses...");
	this.controller.modelChanged(this.selectorsModel);
	$('infotext').innerHTML = "";
	$('highscore').innerHTML = "";
	this.spinnerModel.spinning = true;
	this.controller.modelChanged(this.spinnerModel);
	$('waiting_spinner3').style.display = "block";

	registerGpsCallback(this.onSuccessGPS.bind(this));
}

CourseselectorAssistant.prototype.onSuccessGPS = function(event){
	if (this.getAccuracy(event.horizAccuracy, event.vertAccuracy) < 51.0) {
		this.gpstext = 999;
		
		unRegisterGpsCallback();
		
		var url = "http://vcgs.omoco.de/vcgs/getcourses.php?lon=" + event.longitude + "&lat=" + event.latitude;
		var request = new Ajax.Request(url, {
			method: 'get',
			evalJSON: 'force',
			onSuccess: this.requestCoursesSuccess.bind(this),
			onFailure: this.requestCoursesFailure.bind(this)
		});
	} else {
		if(this.gpstext == 1)
			$('acc').innerHTML = "<center>" + $L("Please make sure that GPS is<br>activated and working properly!") + "</center>";
		else if(this.gpstext == 2)
			$('acc').innerHTML = "<center>" + $L("You have to be outside and under<br>clear sky to get a good fix!") + "</center>";
		else
			$('acc').innerHTML = "<center>" + $L("GPS deviation too high.<br>Acc. must be <50m") + " (" + this.getAccuracy(event.horizAccuracy, event.vertAccuracy) + "m)</center>";
	}

}

CourseselectorAssistant.prototype.generateTextById = function(id) {
	$('scroller_info').mojo.revealTop();
	$('scroller_highscore').mojo.revealTop();
	
	var text = "<table border=0 cellpadding=0 cellspacing=0>";
	
	text += "<tr><td width=70>Ersteller:</td><td>" + this.selectorsModel.choices[id].creator + "</td></tr>";
	
	text += "<tr><td width=70>Distanz:</td><td>" + this.selectorsModel.choices[id].dist + " m </td></tr>";
	
	var type = "";
	if(this.selectorsModel.choices[id].type == 0)
		type = $L("Random");
	else if(this.selectorsModel.choices[id].type == 1)
		type = $L("Multi-Hole");
	else if(this.selectorsModel.choices[id].type == 2)
		type = $L("Standard Golf");
	else
		type = $L("Unknown");
	text += "<tr><td>Typ:</td><td>" + type + "</td></tr>";
	
	var shoot = "";
	if(this.selectorsModel.choices[id].shoot == 0)
		shoot = $L("Normal and Accel");
	else if(this.selectorsModel.choices[id].shoot == 1)
		shoot = $L("Normal only");
	else if(this.selectorsModel.choices[id].shoot == 2)
		shoot = $L("Accel only");
	else
		shoot = $L("Unknown");
	text += "<tr><td>" + $L("Shoot") + ":</td><td>" + shoot + "</td></tr>";
	
	var setball = "";
	if(this.selectorsModel.choices[id].setball == 0)
		setball = $L("Not Allowed");
	else if(this.selectorsModel.choices[id].setball == 1)
		setball = $L("Allowed");
	else
		setball = $L("Unknown");
	text += "<tr><td>" + $L("Set Ball:") + "</td><td>" + setball + "</td></tr>";
	
	var info = "";
	text += "<tr><td valign=top>" + $L("Info:") + "</td><td>" + this.selectorsModel.choices[id].infotext + "</td></tr>";
	
	$('infotext').innerHTML = text + "</table>";
	
	if (this.selectorsModel.choices[id].type == 2) {
		$('highscore').innerHTML = $L("Downloading Highscore...");
		
		var url = "http://vcgs.omoco.de/vcgs/gethighscore.php?courseid=" + this.selectorsModel.choices[id].id;
		var request = new Ajax.Request(url, {
			method: 'get',
			evalJSON: 'force',
			onSuccess: this.requestHighscoreSuccess.bind(this),
			onFailure: this.requestHighscoreFailure.bind(this)
		});
	} else {
		$('highscore').innerHTML = "<center><br>" + $L("Only standard golf<br>has highscores.") + "</center>";
	}
}

CourseselectorAssistant.prototype.requestHighscoreSuccess = function(resp) {
	var hstext = "";
	for(i=0; i<10; i++)
		if(resp.responseJSON[i].name != "")
			hstext += "<b>" + (i+1) + ". " + resp.responseJSON[i].name + "</b> (" + resp.responseJSON[i].shots + $L(" Strokes, ") + resp.responseJSON[i].dist + " m )<br>";
	$('highscore').innerHTML = hstext;
}

CourseselectorAssistant.prototype.requestHighscoreFailure = function(resp) {
	$('highscore').innerHTML = $L("Error while downloading");
	//Mojo.Controller.errorDialog("Konnte Highscore nicht runterladen!");
}

CourseselectorAssistant.prototype.courseSelectorChanged = function(event){
	this.selectedCourse = event.value;
	this.generateTextById(this.selectedCourse);
}

CourseselectorAssistant.prototype.requestCoursesSuccess = function(resp) {
	this.spinnerModel.spinning = false;
	this.controller.modelChanged(this.spinnerModel);
	$('waiting_spinner3').style.display = "none";
	
	this.coursesDownloaded = true;
	
	this.selectorsModel.choices = resp.responseJSON;
	if (resp.responseText == "[]") {
		this.coursesDownloaded = false;
		this.selectorsModel.coursename = $L("No courses around!");
		this.controller.modelChanged(this.selectorsModel);
		$('infotext').innerHTML = "";
		$('highscore').innerHTML = "";
		Mojo.Controller.errorDialog($L("No courses around, please create a new one!"));
	}
	this.selectorsModel.coursename = this.selectorsModel.choices[0].value;
	
	this.selectedCourse = 0;
	this.generateTextById(0);
	this.controller.modelChanged(this.selectorsModel);
}

CourseselectorAssistant.prototype.requestCoursesFailure = function(resp) {
	this.spinnerModel.spinning = false;
	this.controller.modelChanged(this.spinnerModel);
	$('waiting_spinner3').style.display = "none";
	
	this.selectorsModel.coursename = $L("Error while downloading");
	this.controller.modelChanged(this.selectorsModel);
	
	Mojo.Controller.errorDialog($L("Could not download courses!"));
}

CourseselectorAssistant.prototype.downloadCourse = function(event) {
	if(!this.coursesDownloaded)
		return -1;
	
	this.spinnerModel.spinning = true;
	this.controller.modelChanged(this.spinnerModel);
	$('waiting_spinner2').style.display = "block";
	
	var id = this.selectedCourse;
	
	rules_setball = this.selectorsModel.choices[id].setball;
	rules_shoot = this.selectorsModel.choices[id].shoot;
	rules_type = this.selectorsModel.choices[id].type;
	rules_id = this.selectorsModel.choices[id].id;
	rules_coursename = this.selectorsModel.choices[id].label.split(" ( ")[0];
	
	var url = this.selectorsModel.choices[id].holesurl;
	var request = new Ajax.Request(url, {
		method: 'get',
		evalJSON: 'force',
		onSuccess: this.requestHolesSuccess.bind(this),
		onFailure: this.requestHolesFailure.bind(this)
	});
		
	var url = this.selectorsModel.choices[id].ballsurl;
	var request = new Ajax.Request(url, {
		method: 'get',
		evalJSON: 'force',
		onSuccess: this.requestBallsSuccess.bind(this),
		onFailure: this.requestBallsFailure.bind(this)
	});
}

CourseselectorAssistant.prototype.requestHolesSuccess = function(resp) {
	holes = resp.responseJSON;
	if (holes.length > 0) 
		this.gotholes = true;
	else {
		this.spinnerModel.spinning = false;
		this.controller.modelChanged(this.spinnerModel);
		$('waiting_spinner2').style.display = "none";
		Mojo.Controller.errorDialog($L("Could not download holes!"));
	}
	this.testForStart();
}

CourseselectorAssistant.prototype.requestHolesFailure = function(resp) {
	this.spinnerModel.spinning = false;
	this.controller.modelChanged(this.spinnerModel);
	$('waiting_spinner2').style.display = "none";
	Mojo.Controller.errorDialog($L("Could not download holes!"));
}

CourseselectorAssistant.prototype.requestBallsSuccess = function(resp) {
	balls = resp.responseJSON;
	if (balls.length > 0) 
		this.gotballs = true;
	else {
		this.spinnerModel.spinning = false;
		this.controller.modelChanged(this.spinnerModel);
		$('waiting_spinner2').style.display = "none";
		Mojo.Controller.errorDialog($L("Could not download balls!"));
	}
	this.testForStart();
}

CourseselectorAssistant.prototype.requestBallsFailure = function(resp) {
	this.spinnerModel.spinning = false;
	this.controller.modelChanged(this.spinnerModel);
	$('waiting_spinner2').style.display = "none";
	Mojo.Controller.errorDialog($L("Could not download balls!"));
}

CourseselectorAssistant.prototype.testForStart = function(event) {
	if (this.gotholes && this.gotballs) {
		this.gotholes = false;
		this.gotballs = false;

		Mojo.Controller.stageController.swapScene("main");
	}
}

CourseselectorAssistant.prototype.activate = function(event) {
	Mojo.Controller.stageController.setWindowProperties({ blockScreenTimeout: true });
}

CourseselectorAssistant.prototype.deactivate = function(event) {

}

CourseselectorAssistant.prototype.cleanup = function(event) {
	unRegisterGpsCallback();
}

CourseselectorAssistant.prototype.handleCommand = function(event){
    if(event.type == Mojo.Event.command) {	
		switch (event.command) {
			case 'about':
				Mojo.Controller.stageController.pushScene("about");
				break;
			case 'settings':
				Mojo.Controller.stageController.pushScene("settings");
				break;
			case 'refresh':
				this.refresh();
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

CourseselectorAssistant.prototype.getAccuracy = function(hori, vert) {
	if(hori > vert)
		return Math.round(hori);
	else
		return Math.round(vert);
}