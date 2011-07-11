// ===================================
// `tail -f` in Node.js and WebSockets
// ===================================
var http    = require('http'),
    io      = require('socket.io'),
    fs      = require('fs');

var backlog_size = 5000;
var log_dir = "/var/log/";
var logs = [];
// look up the dir for logs
fs.readdir(log_dir, function(err,files){
  if(err) throw err;
  files = Array.prototype.sort.apply(files,[]);
  for(var file in files){
    file = files[file];
    if(fs.statSync(log_dir+file).isFile()) logs.push(file);
  }
});

// -- Node.js HTTP Server ----------------------------------------------------------
server = http.createServer(function(req, res){
  res.writeHead(200, {'Content-Type': 'text/html'})
  fs.readFile(__dirname + '/index.html', function(err, data){
    res.write(data, 'utf8');
    res.end();
  });
})
server.listen(8000);

// -- Setup Socket.IO ---------------------------------------------------------
var io = io.listen(server);
io.set('log level', 0);

io.sockets.on('connection', function(client){
  var filename;
  client.json.send( { logs : logs } );
  client.on("message",function(message){
    if(message.log){
      // Stop watching the last file and send the new one
      fs.unwatchFile(filename);
      filename = log_dir + message.log;
      client.json.send({filename: filename});

      // send some back log
      fs.stat(filename,function(err,stats){
        if (err) throw err;
        if (stats.size == 0){
          client.json.send({clear:true});
          return;
        }
        var start = (stats.size > backlog_size)?(stats.size - backlog_size):0;
        var stream = fs.createReadStream(filename,{start:start, end:stats.size});
        stream.addListener("data", function(lines){
          lines = lines.toString('utf-8');
          lines = lines.slice(lines.indexOf("\n")+1).split("\n");
          client.json.send({ tail : lines});
        });
      });

      // watch the file now
      fs.watchFile(filename, function(curr, prev) {
        if(prev.size > curr.size) return {clear:true};
        var stream = fs.createReadStream(filename, { start: prev.size, end: curr.size});
        stream.addListener("data", function(lines) {
          client.json.send({ tail : lines.toString('utf-8').split("\n") });
        });
      });

      // stop watching the file
      client.on("disconnect",function(){
        fs.unwatchFile(filename);
      });
    }
  });
});

console.log('Log Server running now at http://[HOSTNAME]:8000/ in your browser');
