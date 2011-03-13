// ===================================
// `tail -f` in Node.js and WebSockets
// ===================================
var http    = require('http'),
    io      = require('socket.io'),
    fs      = require('fs');

var backlog_size = 2000;
var filename = process.ARGV[2];
if (!filename) return util.puts("Usage: node <server.js> <filename>");

// -- Node.js HTTP Server ----------------------------------------------------------
server = http.createServer(function(req, res){
  res.writeHead(200, {'Content-Type': 'text/html'})
  fs.readFile(__dirname + '/index.html', function(err, data){
  	res.write(data, 'utf8');
  	res.end();
  });
})
server.listen(8000, '0.0.0.0');

// -- Setup Socket.IO ---------------------------------------------------------
var socket = io.listen(server);
socket.on('connection', function(client){
  client.send( { filename : filename } );
  fs.stat(filename,function(err,stats){
    if (err) throw err;
    var start = (stats.size > backlog_size)?(stats.size - backlog_size):0;
    var stream = fs.createReadStream(filename,{start:start, end:stats.size});
    stream.addListener("data", function(lines){
      lines = lines.toString('utf-8');
      lines = lines.slice(lines.indexOf("\n")+1).split("\n");
      client.send({ tail : lines});
    });
  });
});

// watch the file now
fs.watchFile(filename, function(curr, prev) {
  if(prev.size > curr.size) return {clear:true};
  var stream = fs.createReadStream(filename, { start: prev.size, end: curr.size});
  stream.addListener("data", function(lines) {
    socket.broadcast({ tail : lines.toString('utf-8').split("\n") });
  });
});

console.log('Server running at http://0.0.0.0:8000/, connect with a browser to see tail output');
