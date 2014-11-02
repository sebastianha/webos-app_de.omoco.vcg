GPSCALLBACKFUNCTION = null;
	
function onSuccessGPS(event){
	if(GPSCALLBACKFUNCTION != null)
		GPSCALLBACKFUNCTION(event);
}

function onFailureGPS(event){
}

function registerGpsCallback(functionname) {
	GPSCALLBACKFUNCTION = functionname;
}

function unRegisterGpsCallback() {
	GPSCALLBACKFUNCTION = null;
}