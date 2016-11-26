// top level variables
var map, sv, panorama, markers = [];
var pos, neg, neu, socket;
var center = new google.maps.LatLng(40.758896, -73.985130);
var stream = 0;


function initMap() {

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

    google.maps.event.addListener(map, 'click', function(e) {
                document.getElementById("center").value = e.latLng.toUrlValue();
    });

    google.maps.event.addDomListener(document.getElementById("search"),"click", searchkw);

    google.maps.event.addDomListener(document.getElementById("realtime"), "click", function() {
        var elem = document.getElementById("realtime");
        if (elem.value=="Start Real-Time") {
            stream = 1;
            elem.value = "Stop Real-Time";
        }
        else {
            stream = 0;
            elem.value = "Start Real-Time";
        }
    });


	startListening();
}

function startListening() {
	socket = io.connect();
	socket.on('tweets:connected', function (msg) {
        alert(msg.msg);
	});

	socket.on('tweets:channel', function (msg) {
        //alert(msg.msg);
        if (stream == 1) {
            tweet = msg.msg;
			addMarker(tweet);
        }
	});

    socket.on('search:request', function (res) {
        if (stream == 0) {
            if (res.length == 0) {
                alert('No tweet post recently contains this keyword.');
            }
            for (i=0; i<res.length; i++) {
                addMarker(res[i]);
            }
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

    var marker = new google.maps.Marker({
		position: {lat: tweet.coordinates[1], lng: tweet.coordinates[0]},
		map: map,
		icon: icon,
		animation: google.maps.Animation.DROP
	})

    var info = new google.maps.InfoWindow({ content: '<div id="content"><div id="siteNotice"></div><h1 id="firstHeading" class="firstHeading">'+tweet.username+'</h1><div id="bodyContent"><p>'+tweet.text+'</p>'});

    marker.addListener('click', function() {
        map.setCenter(marker.getPosition());
        info.open(map, marker);
        sv.getPanorama({location: marker.getPosition(), radius: 100}, processSVData);
    });

	markers.push(marker);
}

function searchkw(){
    stream = 0;
    var elem = document.getElementById("realtime");
    elem.value = "Start Real-Time";
    for (i=0; i<markers.length; i++) {
        markers[i].setMap(null);
    }
    markers = [];
    map.setZoom(2);
    var keyword = $("#kw").val();
    if (keyword=="") {
        alert('Keyword cannot be null.');
    }else {
        socket.emit('search:request', {keyword: keyword});
    }
}


google.maps.event.addDomListener(window, 'load', initMap);

