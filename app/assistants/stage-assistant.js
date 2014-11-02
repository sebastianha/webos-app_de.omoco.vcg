function StageAssistant() {
}

StageAssistant.prototype.setup = function() {
	OWNER = $L("Anonymous");
	UPLOADHS = true;
	TWITTERHS = false;
	RESETSLIDER = false;
	MAPTYPE = "Mapnik"

	GPSHACK = 0;
	var cookie2 = new Mojo.Model.Cookie("VCGGpsHack");
	var VCGGpsHack = cookie2.get();
	if (VCGGpsHack != null) {
		if(VCGGpsHack.gpshack != null)
			GPSHACK = VCGGpsHack.gpshack;
	}
	
	var cookie = new Mojo.Model.Cookie("VCGSettings");
	var VCGSettings = cookie.get();
	if(VCGSettings != null)	{
		if(VCGSettings.owner != null)
			OWNER = VCGSettings.owner;
		if(VCGSettings.uploadhs != null)
			UPLOADHS = VCGSettings.uploadhs;
		if(VCGSettings.twitterhs != null)
			TWITTERHS = VCGSettings.twitterhs;
		if(VCGSettings.resetslider != null)
			RESETSLIDER = VCGSettings.resetslider;
		if(VCGSettings.maptype != null)
			MAPTYPE = VCGSettings.maptype;

		this.controller.pushScene("welcome");
	}
	else {
		this.controller.pushScene("welcome");
		this.controller.pushScene("settings");
		this.controller.pushScene("tutorial");
	}
}
