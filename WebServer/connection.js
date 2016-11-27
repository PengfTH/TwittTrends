var elasticsearch=require('elasticsearch');

var client = new elasticsearch.Client( {
  hosts: 'https://search-twitterma-demo-3jefbxfb73i3cphbsiy5prjxpu.us-west-2.es.amazonaws.com',
  connectionClass: require('http-aws-es'),
  amazonES: {
  	region: 'us-west-2',
  	accessKey: '',
  	secretKey: ''
  }
});

module.exports = client;
