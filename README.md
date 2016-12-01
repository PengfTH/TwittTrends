# TwittTrends

•	Deveploed a website where users can see real-time stream of twitts on Google Map and search recent twitts by constraining keyword and geographocal area.

•	Implemented the website with Node.js, using socket.io to enable real-time display of twitt stream.

•	Using Twitter Streaming API to get twitts and Google Map API to show markers on the map and Google Street View of the places.

•	Using IBM Alchemy API to analysis the sentiment of twitts.

•	Using Amazon Web Service (AWS) to maintain the workflow and make the application scalable. Read a stream of twitts from the Twitter Streaming API and send them to to Amazon Message Queueing Service (SQS) for asynchronous processing. A worker pool, which is a thread, will pick up messages from the queue to process. After analysing the sentiment of a twitt, send a notification containing the twitt and its sentiment to the web server using Amazon Push Notification Service. Once receiving a notification, the web server send it to the front end in real-time as well as store it to Elasticsearch for keyword search. Deploy the application on Amazon Elastic Beanstalk.

![alt tag](https://github.com/jessicatsaon/TwittTrends/blob/master/demo.png)
