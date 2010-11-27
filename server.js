// http://stackoverflow.com/questions/3499152/minimum-websocket-nodejs-tail-example/3646471#3646471

var util = require('util')

var spawn = require('child_process').spawn;

var filename = process.ARGV[2];
if (!filename) return util.puts("Usage: node <server.js> <filename>");

var tail = spawn("tail", ["-f", filename]);

http = require('http');

http.createServer(function (req, res) {
  res.writeHead(200, {'Content-Type': "text/plain;charset=UTF-8"});
  tail.stdout.on("data", function (data) {
    res.write(data);
  }); 
}).listen(8000);
