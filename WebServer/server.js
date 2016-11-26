var express = require('express');
var AWS = require("aws-sdk");
var bodyParser = require('body-parser');

var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var SNSClient = require('aws-snsclient');
var sns = new AWS.SNS();

// setup static content
app.use(express.static(__dirname + "/public"));

// parse application/json
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

var Twitter = require('twitter');
/*var client = new Twitter({
    consumer_key: 'o3nILrsPVcTdIXKc7DCFsrs8d',
    consumer_secret: 'uUf7Tl0sPBqT0epJt7CPbm0y5lFMKimZDCrvumHjs0xiF9rlQd',
    access_token_key: '783379170810290176-maE3Eqiv3K2Nj9Mm3ehEfNvXdnschSZ',
    access_token_secret: 'ahIrQ0UoRPf90F8527N0ghveBd213S2qJHfKTAgTwFbER'
});*/

var curSocket = undefined;
var count = 0;

function handleIncomingMessage( msgType, msgData ) {
    if( msgType === 'SubscriptionConfirmation') {
        console.log(msgData);
    } else if ( msgType === 'Notification' ) {
        curSocket.emit("tweets:channel", {msg: msgData.Message});
        //console.log(msgData.Message);
    } else {
        console.log( 'Unexpected message type ' + msgType );
    }
}

app.post('/', function(request, response){
    console.log('post');
    request.setEncoding('utf8');
    var msgBody = '';
    request.on( 'data', function( data ){
        msgBody += data;
    });
    request.on( 'end', function(){
        var msgData = JSON.parse( msgBody );
        var msgType = request.headers[ 'x-amz-sns-message-type' ];
        handleIncomingMessage( msgType, msgData );
    });
    // SNS doesn't care about our response as long as it comes
    // with a HTTP statuscode of 200
    response.end( 'OK' );
});

function search(msg) {
    console.log(msg.keyword);
}

// beginning socket transmission in response to io.connect() at the client side
io.on('connection', function(socket) {
	curSocket = socket;
    console.log("new user connected");
    socket.emit("tweets:connected", { msg: "hello world from server" });

    curSocket.on('search:request', function(msg) {
		search(msg);
	});
});


var port = 8000;
// start listening
http.listen(process.env.PORT || port, function() {
    console.log('listening on 8000');
});
