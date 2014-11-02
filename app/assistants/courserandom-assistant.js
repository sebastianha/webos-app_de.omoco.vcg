function CourserandomAssistant() {

}

CourserandomAssistant.prototype.setup = function() {
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

	this.distances = [{label: "50m", value: "50m"},
		{label: "100m", value: "100m"},
		{label: "200m", value: "200m"},
		{label: "300m", value: "300m"},
		{label: "500m", value: "500m"},
		{label: "750m", value: "750m"},
		{label: "1000m", value: "1000m"},
		{label: "1500m", value: "1500m"},
		{label: "2500m", value: "2500m"},
		{label: "5000m", value: "5000m"}
	];
	this.bearings = [{label: $L("Random"), value: "r"},
		{label: $L("North"), value: "n"},
		{label: $L("North-East"), value: "no"},
		{label: $L("East"), value: "o"},
		{label: $L("South-East"), value: "so"},
		{label: $L("South"), value: "s"},
		{label: $L("South-West"), value: "sw"},
		{label: $L("West"), value: "w"},
		{label: $L("North-West"), value: "nw"}
	];
	this.selectorsModel = { distance: "50m", bearing: $L("Random") };
	this.controller.setupWidget('distance_selector', {label: $L("Radius"), choices: this.distances, modelProperty:'distance'}, this.selectorsModel);
	this.controller.setupWidget('bearing_selector', {label: $L("Direction"), choices: this.bearings, modelProperty:'bearing'}, this.selectorsModel);
	
	this.controller.listen($('generate_course'),Mojo.Event.tap, this.generateCourse.bind(this));
	
	this.gpstext = 0;
	this.swapGPSText.bind(this).delay(30);
}

CourserandomAssistant.prototype.swapGPSText = function() {
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

CourserandomAssistant.prototype.generateCourse = function(event){
	this.spinnerModel.spinning = true;
	this.controller.modelChanged(this.spinnerModel);
	$('waiting_spinner2').style.display = "block";
	
	registerGpsCallback(this.onSuccessGPS.bind(this));
}

CourserandomAssistant.prototype.onSuccessGPS = function(event){
	if (this.getAccuracy(event.horizAccuracy, event.vertAccuracy) < 51.0) {
		this.gpstext = 999;
		
		unRegisterGpsCallback();
		
		var distance = this.selectorsModel.distance.split('m')[0]/1000.0;
		var bearing = this.selectorsModel.bearing;
		if (bearing == "n") {
			bearing = this.getRandom(0, 40);
			bearing = bearing - 20;
			if (bearing < 0)
				bearing = 360 + bearing;
		} else if(bearing == "no")
			bearing = this.getRandom(25, 65);
		else if(bearing == "o")
			bearing = this.getRandom(70, 110);
		else if(bearing == "so")
			bearing = this.getRandom(115, 155);
		else if(bearing == "s")
			bearing = this.getRandom(160, 200);
		else if(bearing == "sw")
			bearing = this.getRandom(205, 245);
		else if(bearing == "w")
			bearing = this.getRandom(250, 290);
		else if(bearing == "nw")
			bearing = this.getRandom(295, 335);
	
		else
			bearing = this.getRandom(0, 360); 
		
		var hole = this.calcCoord(event.longitude, event.latitude, distance, bearing);
		
		var ts = new Date().getTime()/1000.0;
		holes = [{id: 0, lon:hole[0].lon, lat:hole[0].lat, holeins: 0, owner: "unknown", lastshooter: "unknown", tscreated: ts, tslastholein: ts }];
		balls = [{id: 0, lon:event.longitude, lat:event.latitude, startlon:event.longitude, startlat:event.latitude, shots: 0, dist:0, owner: "unknown", lastshooter: "unknown", tscreated: ts, tslastshot: 0 }];
		
		rules_setball = 1;
		rules_shoot = 0;
		rules_type = 0;
		rules_id = 0;
		rules_coursename = "";
		
		Mojo.Controller.stageController.swapScene("main");
	} else {
		if(this.gpstext == 1)
			$('acc').innerHTML = "<center>" + $L("Please make sure that GPS is<br>activated and working properly!") + "</center>";
		else if(this.gpstext == 2)
			$('acc').innerHTML = "<center>" + $L("You have to be outside and under<br>clear sky to get a good fix!") + "</center>";
		else
			$('acc').innerHTML = "<center>" + $L("GPS deviation too high.<br>Acc. must be <50m") + " (" + this.getAccuracy(event.horizAccuracy, event.vertAccuracy) + "m)</center>";
	}
}

CourserandomAssistant.prototype.activate = function(event) {
	Mojo.Controller.stageController.setWindowProperties({ blockScreenTimeout: true });
}

CourserandomAssistant.prototype.deactivate = function(event) {

}

CourserandomAssistant.prototype.cleanup = function(event) {
	unRegisterGpsCallback();
}

CourserandomAssistant.prototype.getRandom = function(min, max){
	if (min > max) {
		return (-1);
	}
	if (min == max) {
		return (min);
	}
	return (min + parseInt(Math.random() * (max - min + 1)));
}

CourserandomAssistant.prototype.calcCoord = function(lon_in, lat_in, distance, bearing) {
	bearing = 360 - bearing;
	
	lat1 = lat_in * Math.PI/180.0;
	lon1 = lon_in * Math.PI/180.0;
	d = distance/6371.0;
	tc = (bearing / 90)* Math.PI / 2.0;
	lat = Math.asin(Math.sin(lat1)*Math.cos(d)+Math.cos(lat1)*Math.sin(d)*Math.cos(tc));
	lat = 180.0 * lat / Math.PI;
	
	if (Math.cos(lat1)==0)
	{
		lon=lon_in; // endpoint a pole
	} else {
		lon = ((lon1 - Math.asin(Math.sin(tc) * Math.sin(d)/Math.cos(lat1)) + Math.PI) % (2 * Math.PI)) - Math.PI;
	}
	lon = 180.0 * lon / Math.PI;
	
	return_value = [];
	return_value.push({lon:lon, lat:lat });
	
	return return_value;
}

CourserandomAssistant.prototype.handleCommand = function(event){
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

CourserandomAssistant.prototype.getAccuracy = function(hori, vert) {
	if(hori > vert)
		return Math.round(hori);
	else
		return Math.round(vert);
}