var http    = require('http');
var spawn   = require('child_process').spawn;
var crypto  = require('crypto');
var url     = require('url');

var secret  = 'myturn-webhook'; // secret key of the webhook
var port    = 8081; // port

http.createServer(function(req, res){

  console.log("request received");
  res.writeHead(400, {"Content-Type": "application/json"});

  var path = url.parse(req.url).pathname;

  if(path!='/push' || req.method != 'POST'){
    var data = JSON.stringify({"error": "invalid request"});
    return res.end(data);
  }


  var jsonString = '';
  req.on('data', function(data){
    jsonString += data;
  });

  req.on('end', function() {
    var hash = "sha1=" + crypto.createHmac('sha1', secret).update(jsonString).digest('hex');
    if(hash != req.headers['x-hub-signature']){
      console.log('invalid key');
      var data = JSON.stringify({"error": "invalid key", key: hash});
      return res.end(data);
    }

    console.log("running hook.sh");

    var child = spawn('/bin/sh', ['hook.sh']);
    child.stdout.setEncoding('utf8');
    child.stdout.on('data', function(data) {
      console.log('stdout', data);
      // var buff = new Buffer(data);
      // console.log(buff.toString('utf-8'));
    });


    res.writeHead(200, {"Content-Type": "application/json"});

    var data = JSON.stringify({"success": true});
    return res.end(data);

  });


}).listen(port);

console.log("Server listening at " + port);