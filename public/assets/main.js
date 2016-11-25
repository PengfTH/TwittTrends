// top level variables
var mapPoints, map, sv, panorama, markers = [], tweetPoints = [];
var pos, neg, neu, socket;
var center = new google.maps.LatLng(40.758896, -73.985130);


function initMap() {
	mapPoints = new google.maps.MVCArray([]);

    var mapProp = {
		  	center:center,
		  	zoom:2,
            streetViewControl: false,
		  	mapTypeId:google.maps.MapTypeId.ROADMAP
	};
    sv = new google.maps.StreetViewService();
    panorama = new google.maps.StreetViewPanorama(document.getElementById('pano'));
	map = new google.maps.Map(document.getElementById("map-canvas"),mapProp);
    sv.getPanorama({location: center, radius: 100}, processSVData);

	startListening();
}

function startListening() {
	socket = io.connect();
	socket.on('tweets:connected', function (msg) {
        alert(msg.msg);
	});

	socket.on('tweets:channel', function (tweet) {
		if (tweet.coordinates !== undefined) {
			tweetPoints.push(tweet);
			mapPoints.push(new google.maps.LatLng(tweet.coordinates[1], tweet.coordinates[0]));
			addMarker(tweet);
		}
	});
}

function processSVData(data, status) {
        if (status === 'OK') {
          panorama.setPano(data.location.pano);
          panorama.setPov({
            heading: 270,
            pitch: 0
          });
          panorama.setVisible(true);
        } else {
          alert('Street View data not found for this location.');
        }
}


function addMarker (tweet) {
	var icon = "http://maps.google.com/mapfiles/ms/icons/blue-dot.png";

	if(tweet.sentiment == "positive") {
		icon = "http://maps.google.com/mapfiles/ms/icons/green-dot.png";
		pos += 1;
	} else if (tweet.sentiment == "negative") {
		icon = "http://maps.google.com/mapfiles/ms/icons/red-dot.png";
		neg += 1;
	} else {
		neu += 1;
	}

	markers.push(new google.maps.Marker({
		position: {lat: tweet.coordinates[1], lng: tweet.coordinates[0]},
		map: map,
		icon: icon,
		animation: google.maps.Animation.DROP,
		title: tweet.text
	}));
}

google.maps.event.addDomListener(window, 'load', initMap);


$(document).ready(function() {
});
