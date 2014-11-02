/*
 * This Class is for interaction with the Map
 */

function Map()
{
	// Actual Position of the user on the map
	this.lat = 10.0;
	this.lon = 10.0;
	// Center Object of actual Position
	this.center = new OpenLayers.LonLat(this.lon , this.lat);
	// Actual zoom of the map
	this.zoom = 13;

	// Bearing set with slider
	this.bearing = 0;
	// Power set with slider
	this.power = 0;
	
	layerMarkersBearing = new OpenLayers.Layer.Markers("Markers");
	//layerMarkersPower = new OpenLayers.Layer.Markers("Markers");
	layerMarkersBalls = new OpenLayers.Layer.Markers("Markers");
	layerMarkersHoles = new OpenLayers.Layer.Markers("Markers");
}

// Array of all Balls
// ID = ID of the ball
// lon,lat = Actual position of the ball
// startlon,startlat = Where has the ball been placed?
// shots = How often did this ball has been shot?
// dist = Integration of all distances of all shots
// owner = Who owns this ball?
// lastshooter = Who was the last shooting this ball?
// tscreated = Unix timestamp of creationtime
// tslastshot = Unix timestamp of last shot
var balls = [];
balls.push({id: -1, lon:13.3, lat:79.3, startlon:13.3, startlat:79.3, shots: 0, dist:0, owner: "Sebastian", lastshooter: "Sebastian", tscreated: 0, tslastshot: 0 });

// Array of all Holes
// ID = ID of the hole
// lon,lat = Position of the hole
// holeins = How much balls are lying in this hole?
// owner = Who has set this hole?
// lastshooter = Who got the last ball in?
// tscreated = Unix timestamp of creationtime
// tslastholein = Unix timestamp of last holein
var holes = [];
holes.push({id: -1, lon:13.3, lat:79.3, holeins: 0, owner: "Sebastian", lastshooter: "Sebastian", tscreated: 0, tslastholein: 0 });

var rules_shoot = 0;
var rules_setball = 1;
var rules_type = 0;
var rules_id = 0;
var rules_coursename = "";

// Creates the Map
Map.prototype.start = function()
{
	// Standard projections
    this.projection = new OpenLayers.Projection("EPSG:900913");
    this.displayProjection =  new OpenLayers.Projection("EPSG:4326");
	
	// Options for the map
    this.map = new OpenLayers.Map("map", {
		controls: [],
		maxExtent: new OpenLayers.Bounds(-20037508.34,-20037508.34,20037508.34,20037508.34),
		numZoomLevels: 19,
		maxResolution: 156543.0399,
		units: 'm',
		projection: this.projection,
		displayProjection: this.displayProjection
    });

	// I need this global of the map for the popups. I don't now how to do it better it just did not work
	boeseglobalemap = this.map;

	// Controls of the map (none)
    this.navigationControl = new OpenLayers.Control.Navigation();
    this.map.addControl(this.navigationControl);
    
	// Standard layers
	var layerMap;
	if(MAPTYPE == "Osmarender")
		layerMap = new OpenLayers.Layer.OSM.Osmarender("Osmarender");
	else
		layerMap = new OpenLayers.Layer.OSM.Mapnik("Mapnik");
	this.map.addLayer(layerMap);

	// Set center to start lat/lon
    this.map.setCenter(this.center.transform(this.displayProjection, this.projection), this.zoom);

	// Bearing layer
	this.map.addLayer(layerMarkersBearing);
	// Power Layer	
	//this.map.addLayer(layerMarkersPower);

	// Balls Layer
	this.map.addLayer(layerMarkersBalls);
	// Holes Layer
	this.map.addLayer(layerMarkersHoles);

	/*variable = "http://omoco.de/testlayer.txt";
	var pois = new OpenLayers.Layer.Text( "My Points",
	{ 
		location:variable,
		projection: this.displayProjection
	});
	this.map.addLayer(pois);*/
};

// Adds a new Marker to the map with popup
// Note tha icon has to be a clone()
Map.prototype.addMarker = function(layer, lon, lat, icon, text) {
		// Create position on map
		var pos = new OpenLayers.LonLat(lon , lat);
		pos.transform(this.displayProjection, this.projection)
		
		/*******************
		// Features of the popup
		var feature = new OpenLayers.Feature(layer, pos);
		feature.closeBox = true;
		feature.data.popupContentHTML = "<div style='padding-left:10px'><font size=2>" + text + "</font></div>";
		feature.data.popupSize = new OpenLayers.Size(140, 130);
		feature.data.overflow = "hidden";
		*******************/

		// Create marker
		var marker = new OpenLayers.Marker(pos, icon);
		// Set features to marker
		
		/*******************
		marker.feature = feature;
		
		// OnClick function for marker
		var markerClick = function(evt) {
			for( i = 0; i < boeseglobalemap.popups.length; i++ ) {
				if(this.popup != boeseglobalemap.popups[i])
					boeseglobalemap.popups[i].hide();
			}
			
	        if (this.popup == null) {
	            this.popup = this.createPopup(this.closeBox);
	            boeseglobalemap.addPopup(this.popup);
	            this.popup.show();
	        } else {
	            this.popup.toggle();
	        }
	        OpenLayers.Event.stop(evt);
	    };
		
		// Register click to marker
		marker.events.register("mousedown", feature, markerClick);
		*******************/
		
		// Add marker to layer
		layer.addMarker(marker);
}

// Refreshes Overlays
Map.prototype.refreshOverlays = function() {
	// Remove popups
	this.refreshPopups();
	// Remove and add holes with popups
	this.refreshHoles();
	// Remove and add balls with popups
	this.refreshBalls();
}

// Removes all popups. They are added in the balls/holes function again
Map.prototype.refreshPopups = function() {
	while( boeseglobalemap.popups.length ) {
		boeseglobalemap.popups[0].destroy();
		boeseglobalemap.removePopup(boeseglobalemap.popups[0]);
	}
}

// Refreshes the balls layer
Map.prototype.refreshBalls = function() {
	
	// VON SERVER HOLEN
	
	var size = new OpenLayers.Size(32,32);
	var offset = new OpenLayers.Pixel(-(size.w/2), -size.h/2);
	
	var icon = new OpenLayers.Icon('images/map/golfball.png',size,offset);
	var iconOwn = new OpenLayers.Icon('images/map/golfballown.png',size,offset);
	
	var tmpIcon;
	
	while( layerMarkersBalls.markers.length ) {
		layerMarkersBalls.markers[0].destroy();
		layerMarkersBalls.removeMarker(layerMarkersBalls.markers[0]);
	}
	
	layerMarkersBalls.clearMarkers();
	
	for (i=0; i < balls.length; i++) {
		if(balls[i].owner == OWNER)
			tmpIcon = iconOwn.clone();
		else
			tmpIcon = icon.clone();

		var tmpDateCreatedStr = new Date(balls[i].tscreated*1000.0).format("dd.mm.yy HH:MM:ss");
		var tmpDateLastShotStr = new Date(balls[i].tslastshot*1000.0).format("dd.mm.yy HH:MM:ss");

		var tmpText = "<b>Ball " + balls[i].id + "</b> ( " + balls[i].shots + " Schläge )<br>Erstellt: " + tmpDateCreatedStr + "<br>Von: " + balls[i].owner + "<br>Zuletzt: " + tmpDateLastShotStr + "<br>Von: " + balls[i].lastshooter;

		this.addMarker(layerMarkersBalls, balls[i].lon, balls[i].lat, tmpIcon, tmpText);
	}
}

// Refreshes the holes layer
Map.prototype.refreshHoles = function() {
	
	// VON SERVER HOLEN
	
	var size = new OpenLayers.Size(45,75);
	var offset = new OpenLayers.Pixel(-12, -66);
	
	var icon = new OpenLayers.Icon('images/map/flag.png',size,offset);
	
	while( layerMarkersHoles.markers.length ) {
		layerMarkersHoles.markers[0].destroy();
		layerMarkersHoles.removeMarker(layerMarkersHoles.markers[0]);
	}
	
	layerMarkersHoles.clearMarkers();
	
	for (i=0; i < holes.length; i++) {
		tmpIcon = icon.clone();
		
		var tmpDateCreatedStr = new Date(holes[i].tscreated*1000.0).format("dd.mm.yy HH:MM:ss");
		var tmpDateLastHoleInStr = new Date(holes[i].tslastholein*1000.0).format("dd.mm.yy HH:MM:ss");
		
		var tmpText = "<b>Loch " + holes[i].id + "</b> ( " + holes[i].holeins + " Eingelocht )<br>Erstellt: " + tmpDateCreatedStr + "<br>Von: " + holes[i].owner + "<br>Zuletzt: " + tmpDateLastHoleInStr + "<br>Von: " + holes[i].lastshooter;
		
		this.addMarker(layerMarkersHoles, holes[i].lon, holes[i].lat, tmpIcon, tmpText);
	}
}

// Set bearing
Map.prototype.setBearing = function(bearing) {
	this.bearing = bearing;
	
	this.placeBearing();
}

// Place bearing layer on map
Map.prototype.placeBearing = function() {
	var size = new OpenLayers.Size(200,200);
	var offset = new OpenLayers.Pixel(-(size.w/2), -size.h/2);
	var icon = new OpenLayers.Icon('images/bearings/' + this.bearing + '.png',size,offset);
	
	while( layerMarkersBearing.markers.length ) {
		layerMarkersBearing.markers[0].destroy();
		layerMarkersBearing.removeMarker(layerMarkersBearing.markers[0]);
	}
	layerMarkersBearing.clearMarkers();
	
	layerMarkersBearing.addMarker(new OpenLayers.Marker(this.center,icon));
}

// Set power
Map.prototype.setPower = function(power) {
	this.power = power;
	
	this.placePower();
}

// Place power layer on map
Map.prototype.placePower = function() {
	/*if(this.power % 10 == 5)
		tmpPower = this.power + 5;
	else
		tmpPower = this.power;
	
	var size = new OpenLayers.Size(320,320);
	var offset = new OpenLayers.Pixel(-(size.w/2), -size.h/2);
	var icon = new OpenLayers.Icon('images/power/' + tmpPower + '.png',size,offset);
	
	while( layerMarkersPower.markers.length ) {
		layerMarkersPower.markers[0].destroy();
		layerMarkersPower.removeMarker(layerMarkersPower.markers[0]);
	}
	layerMarkersPower.clearMarkers();
	
	layerMarkersPower.addMarker(new OpenLayers.Marker(this.center,icon));*/
}

// Zoom one in
Map.prototype.zoomIn = function(){
	this.map.setCenter(this.map.getCenter(), this.map.getZoom()+1);
}

// Zoom one out
Map.prototype.zoomOut = function(){
	this.map.setCenter(this.map.getCenter(), this.map.getZoom()-1);
}

// Set the position of the user on the map
// if map=true the map is recentered, too
// if false only the position layers are moved
Map.prototype.setCenter = function(lon, lat, map) {
	this.lon = lon;
	this.lat = lat;
	
	this.center = new OpenLayers.LonLat(lon , lat);
	this.center = this.center.transform(this.displayProjection, this.projection)
	
	if(map)
		this.map.setCenter(this.center, this.map.getZoom());
	
	this.placeBearing();
	this.placePower();
}

// Recenter Map
Map.prototype.setCenterNow = function() {
	this.map.setCenter(this.center, this.map.getZoom());
	
	this.placeBearing();
	this.placePower();
}

// Returns bearing
Map.prototype.getBearing = function() {
	return this.bearing;
}

// Returns power
Map.prototype.getPower = function() {
	return this.power;
}

// Returns all balls
Map.prototype.getBalls = function() {
	return balls;
}

// Returns the ballId of the neares ball to the user
Map.prototype.getNearestBallId = function() {
	dist = 999999;
	id = 0;
	for (i = 0; i < balls.length; i++) {
		p1 = new OpenLayers.LonLat(balls[i].lon, balls[i].lat);
		p2 = new OpenLayers.LonLat(this.lon, this.lat);
		newDist = OpenLayers.Util.distVincenty(p1, p2);
		
		if(newDist < dist) {
			id = i;
			dist = newDist;
		}
	}
	
	return id;
}

// Returns a ball to a given id
Map.prototype.getBallById = function(id) {
	return balls[id];
}

// Sets a ball to a new position
Map.prototype.setBallById = function(id, lon, lat) {
	p1 = new OpenLayers.LonLat(balls[id].lon, balls[id].lat);
	p2 = new OpenLayers.LonLat(lon, lat);
	balls[id].dist = balls[id].dist + OpenLayers.Util.distVincenty(p1, p2);
	
	balls[id].lon = lon;
	balls[id].lat = lat;
	balls[id].shots =balls[id].shots + 1;
	
	balls[id].lastshooter = OWNER;
	balls[id].tslastshot = new Date().getTime()/1000.0;
	
	// JETZT NOCH AN SERVER SENDEN
	
	return true;
}

// Adds a ball at the current position of the user
Map.prototype.addBallAtPosition = function() {
	this.addBall(this.lon, this.lat);
	
	this.refreshOverlays();
}

// Adds a ball to a given position
Map.prototype.addBall = function(lon, lat) {
	balls.push({id:balls.length, lon:lon, lat:lat, startlon:lon, startlat:lat, shots: 0, dist:0, owner: OWNER, lastshooter: "", tscreated: new Date().getTime()/1000.0, tslastshot: new Date().getTime()/1000.0 });
	
	// JETZT NOCH AN SERVER SENDEN
	
	this.refreshOverlays();
}

// Deletes a ball
Map.prototype.delBall = function(ballId) {
	tmpBalls = balls.clone();
	balls = [];
	for (i = 0; i < tmpBalls.length; i++) {
		if(ballId != i)
			balls.push(tmpBalls[i]);
	}

	// JETZT NOCH AN SERVER SENDEN

	this.refreshOverlays();
}

// Returns the owner of a ball
Map.prototype.getBallOwner = function(ballId) {
	return balls[ballId].owner;
}

// Returns the lastshooter of a ball
Map.prototype.getBallLastShooter = function(ballId) {
	return balls[ballId].lastshooter;
}

// Returns the created TS
Map.prototype.getBallTsCreated = function(ballId) {
	return balls[ballId].tscreated;
}

// Returns the lastshot TS
Map.prototype.getBallTsLastShot = function(ballId) {
	return balls[ballId].tslastshot;
}

// Returns all holes
Map.prototype.getHoles = function() {
	return holes;
}

// Returns the id of the nearest hole to the user
Map.prototype.getNearestHoleId = function() {
	dist = 999999;
	id = 0;
	for (i = 0; i < holes.length; i++) {
		p1 = new OpenLayers.LonLat(holes[i].lon, holes[i].lat);
		p2 = new OpenLayers.LonLat(this.lon, this.lat);
		newDist = OpenLayers.Util.distVincenty(p1, p2);
		
		if(newDist < dist) {
			id = i;
			dist = newDist;
		}
	}
	
	return id;
}

// Returns the id of the nearest hole to a ball
Map.prototype.getNearestHoleIdToBall = function(ballId) {
	dist = 999999;
	id = 0;
	for (i = 0; i < holes.length; i++) {
		p1 = new OpenLayers.LonLat(holes[i].lon, holes[i].lat);
		p2 = new OpenLayers.LonLat(balls[ballId].lon, balls[ballId].lat);
		newDist = OpenLayers.Util.distVincenty(p1, p2);
		
		if(newDist < dist) {
			id = i;
			dist = newDist;
		}
	}
	
	return id;
}

// Updates a hole after a holein
Map.prototype.HoleIn = function(holeId) {
	holes[holeId].holeins = holes[holeId].holeins + 1;
	holes[holeId].lastshooter = OWNER;
	holes[holeId].tslastholein = new Date().getTime()/1000.0;
}

// Returns a hole by a given id
Map.prototype.getHoleById = function(id) {
	return holes[id];
}

// Calculates a distance between two coordinates
Map.prototype.calcDistance = function(lon1, lat1, lon2, lat2) {
	p1 = new OpenLayers.LonLat(lon1, lat1);
	p2 = new OpenLayers.LonLat(lon2, lat2);
	return OpenLayers.Util.distVincenty(p1, p2);
}

// Checks the distance between a ball and the nearest hole
Map.prototype.checkBallHoleDistance = function(ballId){
	dist = 999999;
	id = 0;
	for (i = 0; i < holes.length; i++) {
		p1 = new OpenLayers.LonLat(holes[i].lon, holes[i].lat);
		p2 = new OpenLayers.LonLat(balls[ballId].lon, balls[ballId].lat);
		newDist = OpenLayers.Util.distVincenty(p1, p2);
		
		if (newDist < dist) {
			id = i;
			dist = newDist;
		}
	}

	return dist;
}

// Calculates a new coordinate to a given position, distance and bearing
Map.prototype.calcCoord = function(lon_in, lat_in, distance, bearing) {
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

Map.prototype.cleanUp = function() {
	
}
