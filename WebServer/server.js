var express = require('express');
var AWS = require("aws-sdk");
var bodyParser = require('body-parser');

var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var SNSClient = require('aws-snsclient');
var sns = new AWS.SNS();

var esclient = require('./connection');

// setup static content
app.use(express.static(__dirname + "/public"));

// parse application/json
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

var index = "t3";
var type = "tweet";

var uuid = require("node-uuid")

function tweet2es(tweet) {

    var mapping = {
        type :
            {'properties':
                {
                    'timestamp_ms': {'type': 'date'},
                    'text': {'type': 'string'},
                    'coordinates': {'type': 'geo_point'},
                    'username': {'type': 'string'},
                    'sentiment': {'type': 'string'}
                }
            }
    }

    esclient.indices.exists({index:index}, function(error, response) {
        if (!response) {
            esclient.indices.create({
                index: index,
                body: {"mappings": mapping}
            }, function (error, response, status) {
                console.log(error, response, status);
            });
        }
    });

    esclient.create({
        index: index,
        id: uuid.v4(),
        type: type,
        body: tweet
    }, function (error, response) {
        //console.log(error, response);
    })
}

var curSocket = undefined;
var count = 0;

function handleIncomingMessage( msgType, msgData ) {
    if( msgType === 'SubscriptionConfirmation') {
        console.log(msgData);
    } else if ( msgType === 'Notification' ) {
        if (curSocket != undefined) {
            curSocket.emit("tweets:channel", {msg: msgData.Message});
        }
        tweet2es(msgData.Message);
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
    esclient.search({
        index: "t3",
        type:type,
        body: {
            query : {
                match: {'text': msg.keyword}
            },
        }
    }, function(error, response, status) {
        if (error){
            console.log("search error: " + error);
        } else {
            response.hits.hits.forEach(function(hit) {
                curSocket.emit("search:request", {msg: hit['_source']})
                //console.log(hit['_source']);
            })
        }
    })
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
