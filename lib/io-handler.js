(function() {

  'use strict';

  var fs = require('fs');
  var path = require('path');

  var backlog_size = 5000;

  function streamData(fileName, start, end, socket) {

    var stream = fs.createReadStream(fileName, {
      'start': start,
      'end': end
    });

    stream.addListener("data", function(lines){

      lines = lines.toString('utf-8');
      lines = lines.slice(lines.indexOf("\n") + 1).split("\n");
      socket.emit('tail', lines);
    });

    return stream;
  }

  function onConnect(logDir, logFiles) {

    return function(socket) {

      socket.emit('list', logFiles);

      socket.on('message', function(message) {

        if(message.log) {

          // Stop watching the last file and send the new one
          fs.unwatchFile(fileName);

          var fileName = path.join(logDir, message.log);
          socket.emit('select', fileName);

          // send some back log
          fs.stat(fileName, function(err, stats) {

            if (err) {
              throw err;
            }

            if (stats.size === 0){
              socket.emit('clear');
              return;
            }

            var start = (stats.size > backlog_size) ? (stats.size - backlog_size) : 0;
            streamData(fileName, start, stats.size, socket);
          });

          // watch the file now
          fs.watchFile(fileName, function(curr, prev) {

            if(prev.size > curr.size) {
              return {
                'clear': true
              };
            }

            streamData(fileName, prev.size, curr.size, socket);
          });

          // stop watching the file
          socket.on('disconnect',function() {

            fs.unwatchFile(fileName);
          });
        }
      });
    };
  }

  module.exports = onConnect;

}).call();