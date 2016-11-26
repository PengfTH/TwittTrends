import tweepy
import json
import config
import boto
from boto.sqs.message import Message

class TwitterStreamListener(tweepy.StreamListener):
    def on_connect(self):
        conn = boto.sqs.connect_to_region('us-west-2',
                                          aws_access_key_id=config.es_access_key,
                                          aws_secret_access_key=config.es_access_secret)
        self.queue = conn.get_queue('twitter')

    def on_error(self, status_code):
        print status_code
    def on_status(self, status):
        print(status.text)

    def on_data(self, raw_data):
        decoded = json.loads('[' + raw_data + ']')
        for tweet in decoded:
            if (not ('coordinates' in tweet)) or tweet['coordinates'] == None:
                continue
            if not ('user' in tweet) :
                continue
            message = Message()
            message.set_body(tweet)
            self.queue.write(message)
        return True



listener = TwitterStreamListener()
auth = tweepy.OAuthHandler(config.twitter_consumer_key, config.twitter_consumer_secret)
auth.set_access_token(config.twitter_access_token, config.twitter_access_token_secret)
stream = tweepy.Stream(auth, listener)
stream.filter(locations=[-180.0,-90.0,180.0,90.0], languages=['en'], async=True)
