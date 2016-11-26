import boto.sqs, boto.sns
import config
import json
import sys
from threading import Thread
from watson_developer_cloud import AlchemyLanguageV1

reload(sys)
sys.setdefaultencoding('utf-8')

class Worker(Thread):
    def __init__(self, tweet, conn):
        Thread.__init__(self)
        self.tweet = tweet
        self.nconn = conn

    def parseTweet(self, doc):
        tweet = {}
        tweet['coordinates'] = doc['coordinates']['coordinates']
        print tweet['coordinates']
        tweet['timestamp_ms'] = doc['timestamp_ms']
        tweet['text'] = doc['text'].decode('utf-8')
        tweet['username'] = doc['user']['name'].decode('utf-8')
        #tweet['setiment'] = doc['setiment']
        return tweet

    def run(self):
        #analyze setiment and send to SNS
        alchemy_language = AlchemyLanguageV1(api_key=config.Alchemy_key)
        txt = self.parseTweet(json.loads(self.tweet))
        sentRes = alchemy_language.sentiment(text=txt['text'])
        txt['sentiment'] = sentRes['docSentiment']['type']
        self.nconn.publish(topic='arn:aws:sns:us-west-2:503791085592:twitter', message=json.dumps(txt))
        return


class WorkerPool(Thread):
    def __init__(self, key, secret):
        Thread.__init__(self)
        self.qconn = boto.sqs.connect_to_region('us-west-2',
                                  aws_access_key_id=key,
                                  aws_secret_access_key=secret)
        self.nconn = boto.sns.connect_to_region('us-west-2',
                                  aws_access_key_id=key,
                                  aws_secret_access_key=secret)

    def run(self):
        queue = self.qconn.get_queue('twitter')
        while (True):
            messages = queue.get_messages()
            for message in messages:
                worker = Worker(message.get_body(), self.nconn)
                worker.start()
            queue.delete_message_batch(messages)


pool = WorkerPool(config.es_access_key, config.es_access_secret)
pool.start()
