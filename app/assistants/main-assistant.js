function MainAssistant() {
    this.map = new Map();
}

MainAssistant.prototype.setup = function() {
	this.controller.enableFullScreenMode(true);
	
	this.commandMenuAttributes = { menuClass: 'no-fade' };
	this.commandMenuModel = {
		items: [{
			items: [{
				iconPath: 'images/zoom_out.png',
				command: 'zoom_out',
				disabled: true
			}, {
				iconPath: 'images/center_map.png',
				command: 'center_map',
				disabled: true
			}, {
				iconPath: 'images/zoom_in.png',
				command: 'zoom_in',
				disabled: true
			}]
		}, {
			iconPath: 'images/new_ball.png',
			command: 'new_ball',
			disabled: true
		}, {
			items: [{
				iconPath: 'images/shoot_ball_accel.png',
				command: 'shoot_ball_accel',
				disabled: true
			}, {
				iconPath: 'images/shoot_ball.png',
				command: 'shoot_ball',
				disabled: true
			}]
		}]
	};
	this.controller.setupWidget(
		Mojo.Menu.commandMenu, 
		this.commandMenuAttributes,
		this.commandMenuModel
	);	
	
	this.spinnerLAttrs = {spinnerSize: 'large'};
	this.spinnerModel = {spinning: true};
	this.controller.setupWidget('waiting_spinner', this.spinnerLAttrs, this.spinnerModel);
	
	this.slider_bearing_attributes = {
		modelProperty:	'value'
		,minValue:		0
		,maxValue:		360
		,round:			true
		,updateInterval: 0.1
	    };
	this.slider_bearing_model = {
		value : 0
		,width: 0
	}
	this.controller.setupWidget('slider_bearing', this.slider_bearing_attributes, this.slider_bearing_model);
	this.slider_bearing_propertyChanged = this.slider_bearing_propertyChanged.bindAsEventListener(this);
	Mojo.Event.listen(this.controller.get('slider_bearing'),Mojo.Event.propertyChange,this.slider_bearing_propertyChanged);
	this.map.setBearing(0);
	
	this.slider_power_attributes = {
		modelProperty:	'value'
		,minValue:		0
		,maxValue:		100
		,round:			true
		//,updateInterval: 0.5
	    };
	this.slider_power_model = {
		value : 0
		,width: 0
	}
	this.controller.setupWidget('slider_power', this.slider_power_attributes, this.slider_power_model);
	this.slider_power_propertyChanged = this.slider_power_propertyChanged.bindAsEventListener(this);
	Mojo.Event.listen(this.controller.get('slider_power'),Mojo.Event.propertyChange,this.slider_power_propertyChanged);
	this.map.setPower(0);
	
	registerGpsCallback(this.onSuccessGPS.bind(this));
	
	// Now in Commandmenu
	//this.controller.listen($('button_center'),Mojo.Event.tap, this.handleCenterButtonPressed.bind(this));
	//this.controller.listen($('button_addball'),Mojo.Event.tap, this.handleAddBallButtonPressed.bind(this));
	//this.controller.listen($('button_shoot'),Mojo.Event.tap, this.handleShootButtonPressed.bind(this));
	
	this.controller.listen($('shoot_accel_cancel'),Mojo.Event.tap, this.handleShootAccelPressed.bind(this));
	this.controller.listen($('shoot'),Mojo.Event.tap, this.handleShootDivPressed.bind(this));
	this.controller.listen($('holein'),Mojo.Event.tap, this.handleHoleInDivPressed.bind(this));
	
	this.centerOnNextFix = true;
	
	// KONSTANTEN
	this.maxDistanceToBall = 0.015;
	this.maxDistanceToScore = 0.010;
	this.minAccuracy = 36.0;
	
	bearingImages = new Array(181);
	for (i=0; i<=360; i+=2) {
		bearingImages[i/2] = new Image(); 
		bearingImages[i/2].src="images/bearings/" + i + ".png";
	}
	
	// GPS HACK
	if(GPSHACK == 51) {
		this.minAccuracy = 51.0;
	}
};

MainAssistant.prototype.handleShootDivPressed = function(event) {
	$('shoot').style.display = "none";
	this.controller.setMenuVisible(Mojo.Menu.commandMenu, true);
}

MainAssistant.prototype.handleHoleInDivPressed = function(event) {
	$('holein').style.display = "none";
	this.controller.setMenuVisible(Mojo.Menu.commandMenu, true);
	
	if (rules_type == 2) {
		Mojo.Controller.stageController.popScene();
	}
}

MainAssistant.prototype.handleCenterButtonPressed = function(event) {
	this.map.setCenterNow();
}

MainAssistant.prototype.handleAddBallButtonPressed = function(event) {
	this.map.addBallAtPosition();
}

// power von 0-100%
MainAssistant.prototype.handleShoot = function(power){
	if($("toofartoball").style.display == "none") {
		ballId = this.map.getNearestBallId();
		
		oldLon = this.map.getBallById(ballId).lon;
		oldLat = this.map.getBallById(ballId).lat;
		
		// MULTIPLYER FUER SCHLAGDISTANZ
		// X = POWER^2/40.0 in Metern
		// Power: 0   10   20   30   40   50   60   70   80   90  100
		// Meter: 0  2,5   10  22,5  40  62,5  90  122  160  202  250
		newLon = this.map.calcCoord(oldLon, oldLat, power*power/40.0/1000.0, this.map.getBearing())[0].lon;
		newLat = this.map.calcCoord(oldLon, oldLat, power*power/40.0/1000.0, this.map.getBearing())[0].lat;
		
		this.map.setBallById(ballId, newLon, newLat);
		this.map.refreshOverlays();
		
		if(this.map.checkBallHoleDistance(ballId) < this.maxDistanceToScore) {
			var tmpDist = this.map.getBallById(ballId).dist * 1000.0;
			tmpDist = Math.round(tmpDist);
			var tmpHole = this.map.getHoleById(this.map.getNearestHoleIdToBall(ballId));
			var tmpBall = this.map.getBallById(ballId);
			var tmpStartDist = this.map.calcDistance(tmpBall.startlon, tmpBall.startlat, tmpHole.lon, tmpHole.lat)*1000.0;
			tmpStartDist = Math.round(tmpStartDist);
			
			//this.showDialogBox("Eingelocht", "Wohoo, du hast den Golfball eingelocht!<br>Du hast auch nur " + this.map.getBallById(ballId).shots + " Schläge gebraucht.<br>Die Startdistanz betrug: " + tmpStartDist + " m<br>Die Zurückgelegte beträgt: " + tmpDist + " m<br>");
			this.controller.setMenuVisible(Mojo.Menu.commandMenu, false);
			$('holein_info').innerHTML = "<center><h2>" + $L("Hole-In") + "</h2><small>" + $L("Wohoo, you got the ball into the hole<br>It only took you ") + this.map.getBallById(ballId).shots + $L(" strokes.") + "<br><br>" + $L("Initial distance: ") + tmpStartDist + " m<br>" + $L("Your distance: ") + tmpDist + " m<br></small></center>";
			
			if(rules_type == 2) {
				if (TWITTERHS) {
					this.controller.serviceRequest("palm://com.palm.applicationManager", {
					   method: "open",
					   parameters:  {
					       id: 'com.palm.app.browser',
					       params: {
					           target: "http://twitter.com/home?&status=" + $L("completed the golfcourse \"") + rules_coursename + $L("\" with only ") + this.map.getBallById(ballId).shots + $L(" strokes. %23vcg")
					       }
					   }
					 });
				}
				if(UPLOADHS) {
					$('holein_hs').innerHTML = "<center><h2>Highscore</h2><small>" + $L("Uploading result to highscore...") + "</small></center>";
					var url = "http://vcgs.omoco.de/vcgs/sethighscore.php?courseid=" + rules_id + "&name=" + OWNER + "&shots=" + this.map.getBallById(ballId).shots + "&dist=" + tmpDist;
					var request = new Ajax.Request(url, {
						method: 'get',
						evalJSON: 'force',
						onSuccess: this.requestSetHighscoreSuccess.bind(this),
						onFailure: this.requestSetHighscoreFailure.bind(this)
					});
				} else {
					$('holein_hs').innerHTML = "<center><h2>Highscore</h2><small>" + $L("Downloading Highscore...") + "</small></center>";
					var url = "http://vcgs.omoco.de/vcgs/gethighscore.php?courseid=" + rules_id;
					var request = new Ajax.Request(url, {
						method: 'get',
						evalJSON: 'force',
						onSuccess: this.requestHighscoreSuccess.bind(this),
						onFailure: this.requestHighscoreFailure.bind(this)
					});
				}
			}
			$('holein').style.display = "block";
			
			this.map.HoleIn(this.map.getNearestHoleIdToBall(ballId));
			
			this.map.delBall(ballId);
			
		} else {
			var tmpDist = this.map.getBallById(ballId).dist * 100000.0;
			tmpDist = Math.round(tmpDist) / 100.0;
			var tmpDistToHole = this.map.checkBallHoleDistance(ballId) * 100000.0;
			tmpDistToHole = Math.round(tmpDistToHole) / 100.0;
			// MULTIPLYER FUER SCHLAGDISTANZ
			var tmpDistPower = power*power/40.0/1000.0 * 1000.0;
			tmpDistPower = Math.round(tmpDistPower);
					
			//var tmpDateCreatedStr = new Date(this.map.getBallTsCreated(ballId)*1000.0).format("dd.mm.yy<br>HH:MM:ss");
			//var tmpDateLastShotStr = new Date(this.map.getBallTsLastShot(ballId)*1000.0).format("dd.mm.yy<br>HH:MM:ss");

			/*this.showDialogBox("Schuss", "<table border=0 cellpadding=0 cellspacing=0>" +
				"<tr><td width=155>Schlag:</td><td>" + this.map.getBallById(ballId).shots + "</td></tr>" +
				"<tr><td>Zurückg. Distanz:</td><td>" + tmpDist + " m</td></tr>" +
				"<tr><td>Distanz zum n. Loch:</td><td>" + tmpDistToHole + " m</td></tr>" +
				"<tr><td>Bearing:</td><td>" + this.map.getBearing() + " Grad</td></tr>" +
				"<tr><td>Power:</td><td>" + Math.round(power) + " ( ca. " + tmpDistPower + " m )</td></tr>" +
				"<tr><td>Ball Besitzer:</td><td>" + this.map.getBallOwner(ballId) + "</td></tr>" +
				"<tr><td>Letzter Schuss von:</td><td>" + this.map.getBallLastShooter(ballId) + "</td></tr>" +
				"<tr><td>Ball erstellt am:</td><td>" + tmpDateCreatedStr + " Uhr</td></tr>" +
				"<tr><td>Ball z. geschl. am:</td><td>" + tmpDateLastShotStr + " Uhr</td></tr>" +
				"</table>");*/
			this.controller.setMenuVisible(Mojo.Menu.commandMenu, false);
			$('shoot').innerHTML = "<center><h2>" + $L("Stroke") + "</h2><small><table border=0 cellpadding=0 cellspacing=0 width=270>" +
				"<tr><td width=155>" + $L("Stroke No.:") + "</td><td align=right>" + this.map.getBallById(ballId).shots + "</td></tr>" +
				"<tr><td>" + $L("Dist. to start:") + "</td><td align=right>" + tmpDist + " m</td></tr>" +
				"<tr><td>" + $L("Dist. to next hole:") + "</td><td align=right>" + tmpDistToHole + " m</td></tr>" +
				"<tr><td>" + $L("Bearing:") + "</td><td align=right>" + this.map.getBearing() + " °</td></tr>" +
				"<tr><td>" + $L("Power:") + "</td><td align=right>" + Math.round(power) + " ( " + tmpDistPower + " m )</td></tr>" +
				"</table></small></center>"
			$('shoot').style.display = "block";
		}
		
		if (RESETSLIDER) {
			this.slider_bearing_model.value = 0;
			this.controller.modelChanged(this.slider_bearing_model);
			this.map.setBearing(0);
			this.slider_power_model.value = 0;
			this.controller.modelChanged(this.slider_power_model);
			this.map.setPower(0);
		}
	}
	else 
		this.showDialogBox($L("Shoot"), $L("Too far away from a ball!"));
}

MainAssistant.prototype.requestHighscoreSuccess = function(resp) {
	var hstext = "";
	for(i=0; i<5; i++)
		if(resp.responseJSON[i].name != "")
			hstext += "<b>" + (i+1) + ". " + resp.responseJSON[i].name + "</b> (" + resp.responseJSON[i].shots + $L(" Strokes, ") + resp.responseJSON[i].dist + " m )<br>";
	$('holein_hs').innerHTML = "<center><h2>Highscore</h2><small>" + hstext + "</small></center>";
}

MainAssistant.prototype.requestHighscoreFailure = function(resp) {
	$('holein_hs').innerHTML = $L("Error while downloading");
	//Mojo.Controller.errorDialog("Konnte Highscore nicht runterladen!");
}

MainAssistant.prototype.requestSetHighscoreSuccess = function(resp) {
	$('holein_hs').innerHTML = "<center><h2>Highscore</h2><small>" + $L("Upload successful.<br>Downloading highscore...") + "</small></center>";
	var url = "http://vcgs.omoco.de/vcgs/gethighscore.php?courseid=" + rules_id;
	var request = new Ajax.Request(url, {
		method: 'get',
		evalJSON: 'force',
		onSuccess: this.requestHighscoreSuccess.bind(this),
		onFailure: this.requestHighscoreFailure.bind(this)
	});
}

MainAssistant.prototype.requestSetHighscoreFailure = function(resp) {
	$('holein_hs').innerHTML = "<center><h2>Highscore</h2><small>" + $L("Upload failed.<br>Downloading highscore...") + "</small></center>";
	var url = "http://vcgs.omoco.de/vcgs/gethighscore.php?courseid=" + rules_id;
	var request = new Ajax.Request(url, {
		method: 'get',
		evalJSON: 'force',
		onSuccess: this.requestHighscoreSuccess.bind(this),
		onFailure: this.requestHighscoreFailure.bind(this)
	});
}

MainAssistant.prototype.handleShootButtonPressed = function(event) {
	this.handleShoot(this.map.getPower());
}

MainAssistant.prototype.handleAcceleration = function(event) {
	if (this.as_status == 1 && event.accelX < this.as_Xmin)
		this.as_Xmin = event.accelX;
	if (this.as_status == 1 && event.accelX > this.as_Xmax)
		this.as_Xmax = event.accelX;
	
	if (this.as_status == 0) {
		if (event.accelY > 0.8 && this.as_detectorlast > 0.8) {
			this.as_detector = this.as_detector + 1;
			this.as_detectorlast = event.accelY;
			this.as_status2 = this.as_detector;
		}
		else {
			this.as_detector = 0;
			this.as_detectorlast = 1.0;
			this.as_status2 = this.as_detector;
		}
		
		if (this.as_detector > 20) {
			this.as_status = 1;
			this.as_detector = 0;
			this.as_detectorlast = 0;
			Mojo.Controller.getAppController().playSoundNotification("vibrate", "", 1000);
		}
	}
	
	if (this.as_status == 1) {
		if (event.accelY < 0.1 && this.as_detectorlast < 0.1) {
			this.as_detector = this.as_detector + 1;
			this.as_detectorlast = event.accelY;
			this.as_status2 = this.as_detector;
		}
		else {
			this.as_detector = 0;
			this.as_detectorlast = 0;
			this.as_status2 = this.as_detector;
		}
		
		if (this.as_detector > 20) {
			this.as_status = 2;
			this.as_status2 = 0;
			this.as_detector = 0;
			this.as_detectorlast = 0;
			Mojo.Controller.getAppController().playSoundNotification("vibrate", "", 1000);
			
			Mojo.Event.stopListening(document, 'acceleration', this.handleAccelerationListener);
			$('shoot_accel').style.display = "none";
			this.controller.setMenuVisible(Mojo.Menu.commandMenu, true);
			
			this.handleShoot((Math.abs(this.as_Xmin) + Math.abs(this.as_Xmax))*20);
		}
	}
}

MainAssistant.prototype.handleShootAccelButtonPressed = function(event){
	this.controller.setMenuVisible(Mojo.Menu.commandMenu, false);
	$('shoot_accel').style.display = "block";
	
	this.as_Xmin =  99999;
	this.as_Xmax = -99999;
	this.as_detector = 0;
	this.as_detectorlast = 1.0;
	this.as_status = 0;
	this.as_status2 = 0;
	
	this.handleAccelerationListener = this.handleAcceleration.bindAsEventListener(this);
	Mojo.Event.listen(document, 'acceleration', this.handleAccelerationListener);
}

MainAssistant.prototype.handleShootAccelPressed = function(event) {
	Mojo.Event.stopListening(document, 'acceleration', this.handleAccelerationListener);
	$('shoot_accel').style.display = "none";
	this.controller.setMenuVisible(Mojo.Menu.commandMenu, true);
}

MainAssistant.prototype.getAccuracy = function(hori, vert) {
	if(hori > vert)
		return Math.round(hori);
	else
		return Math.round(vert);
}

MainAssistant.prototype.onSuccessGPS = function(event) {
	var accuracy = this.getAccuracy(event.horizAccuracy, event.vertAccuracy);
	
	this.map.setCenter(event.longitude, event.latitude, this.centerOnNextFix);
	if (event.errorCode == 0 && this.centerOnNextFix) {
		this.centerOnNextFix = false;
		
		this.spinnerModel.spinning = false;
		this.controller.modelChanged(this.spinnerModel);
		$('waitforgps').style.display = "none";
		
		this.commandMenuModel.items[0].items[0].disabled = false;
		this.commandMenuModel.items[0].items[1].disabled = false;
		this.commandMenuModel.items[0].items[2].disabled = false;
		this.controller.modelChanged(this.commandMenuModel);
		
		this.map.refreshOverlays();
	}
	
	this.checkReadyToShoot(event.longitude, event.latitude, accuracy);
	
	$('info').innerHTML = "<center>( " + Math.round(event.longitude*1000000.0)/1000000.0 + " / " + Math.round(event.latitude*1000000.0)/1000000.0 + " ) ( " + Math.round(event.horizAccuracy) + " / " + Math.round(event.vertAccuracy) + " )</center>";
}

MainAssistant.prototype.checkReadyToShoot = function(lon, lat, accuracy){
	//this.showDialogBox("acc", horiAcc + " " + vertAcc);
	
	// Update Model only when something has changed, see below
	var cmm = new Array(6);
	cmm[0] = this.commandMenuModel.items[1].disabled;
	cmm[2] = this.commandMenuModel.items[2].items[0].disabled;
	cmm[4] = this.commandMenuModel.items[2].items[1].disabled;

	if(accuracy < this.minAccuracy &&  accuracy != -1) {
		$("toolowacc").style.display = "none";
		//$("button_addball").style.display = "block";
		if(rules_setball == 1)
			this.commandMenuModel.items[1].disabled = false;
	
		var tmpBall = this.map.getBallById(this.map.getNearestBallId());
		var distanceToNextBall = this.map.calcDistance(lon, lat, tmpBall.lon, tmpBall.lat);
		
		if(distanceToNextBall < this.maxDistanceToBall) {
			$("toofartoball").style.display = "none";
			//$("button_shoot").style.display = "block";
			if(rules_shoot == 0 || rules_shoot == 2) {
				this.commandMenuModel.items[2].items[0].disabled = false;
			}
			if(rules_shoot == 2) {
				$("slider_power").style.display = "none";
				$("slider_power_bg").style.display = "none";
			}
			if(rules_shoot == 0 || rules_shoot == 1) {
				this.commandMenuModel.items[2].items[1].disabled = false;
			}
		} else {
			$("toofartoball").style.display = "block";
			tmpDistanceToNextBall = Math.round(distanceToNextBall*1000.0);
			$("toofartoball").innerHTML = "<br><center><b>" + $L("Too far away from a ball.<br>You are ") + tmpDistanceToNextBall + " m " + $L("away.") + "</b></center>";
			//$("button_shoot").style.display = "none";
			this.commandMenuModel.items[2].items[0].disabled = true;
			this.commandMenuModel.items[2].items[1].disabled = true;
		}
	} else {
		$("toolowacc").style.display = "block";
		$("toolowacc").innerHTML = "<br><center><b>" + $L("GPS deviation too high.<br>Acc. must be <") + (this.minAccuracy-1) + "m (" + accuracy + "m)</b></center>";
		$("toofartoball").style.display = "none";
		//$("button_shoot").style.display = "none";
		this.commandMenuModel.items[2].disabled = true;
		//$("button_addball").style.display = "none";
		this.commandMenuModel.items[1].disabled = true;
		//$("button_shoot").style.display = "none";
		this.commandMenuModel.items[2].items[0].disabled = true;
		this.commandMenuModel.items[2].items[1].disabled = true;
	}
	
	cmm[1] = this.commandMenuModel.items[1].disabled;
	cmm[3] = this.commandMenuModel.items[2].items[0].disabled;
	cmm[5] = this.commandMenuModel.items[2].items[1].disabled;
	
	var modelDirty = false;
	
	for(i = 0; i < 6; i+=2) {
		if(cmm[i] != cmm[i+1]) {
			modelDirty = true;
		}
	}
	
	if (modelDirty) {
		this.controller.modelChanged(this.commandMenuModel);
		//this.showDialogBox("Model", "dirty");
	}
}

MainAssistant.prototype.handleCommand = function(event){
    /*if(event.type == Mojo.Event.forward) {
		this.map.zoomIn();
		event.stop();
	}
    if(event.type == Mojo.Event.back) {
		this.map.zoomOut();
		event.stop();
	}*/

	if (event.type == Mojo.Event.command) {
		switch (event.command) {
			case 'zoom_out':
				this.map.zoomOut();
				break;
			case 'center_map':
				this.map.setCenterNow();
				break;
			case 'zoom_in':
				this.map.zoomIn();
				break;
			case 'new_ball':
				this.map.addBallAtPosition();
				break;
			case 'shoot_ball_accel':
				this.handleShootAccelButtonPressed(null);
				break;
			case 'shoot_ball':
				this.handleShootButtonPressed(null);
				break;
		}
	}
}

MainAssistant.prototype.slider_bearing_propertyChanged = function(event) {
	event.value = Math.round(event.value / 2);
	event.value = event.value * 2;
	this.map.setBearing(event.value);
	//this.showDialogBox("Slider Value Changed", "The value of the BEARING Slider field is now: " + event.value);
}

MainAssistant.prototype.slider_power_propertyChanged = function(event) {
	event.value = Math.round(event.value / 2);
	event.value = event.value * 2;
	this.map.setPower(event.value);
	//this.showDialogBox("Slider Value Changed", "The value of the POWER Slider field is now: " + event.value);
}

MainAssistant.prototype.showDialogBox = function(title,message) {
	this.controller.showAlertDialog({
		onChoose: function(value) {},
		title:title,
		message:message,
		allowHTMLMessage: true,
		choices:[ {label:'OK', value:'OK', type:'color'} ]
	});
}

MainAssistant.prototype.activate = function(event) {
	Mojo.Controller.stageController.setWindowProperties({ fastAccelerometer: true });
	Mojo.Controller.stageController.setWindowProperties({ blockScreenTimeout: true });
	this.map.start();
}

MainAssistant.prototype.deactivate = function(event) {
};

MainAssistant.prototype.cleanup = function(event) {
	unRegisterGpsCallback();
};
