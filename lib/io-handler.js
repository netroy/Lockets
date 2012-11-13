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

      var lastFilePath;

      function unwatch() {
        lastFilePath && fs.unwatchFile(lastFilePath);
        lastFilePath = undefined;
      }

      socket.emit('list', logFiles);

      socket.on('request', function(fileName) {

        // Stop watching the last file and send the new one
        lastFilePath && fs.unwatchFile(lastFilePath);

        var filePath = path.join(logDir, fileName);

        // Tell the client that they are watching a new file now
        unwatch();

        // send some back log
        fs.stat(filePath, function(err, stats) {

          if (err) {
            throw err;
          }

          if (stats.size === 0){
            socket.emit('clear');
            return;
          }

          var start = (stats.size > backlog_size) ? (stats.size - backlog_size) : 0;
          streamData(filePath, start, stats.size, socket);

          // watch the file now
          fs.watchFile(filePath, function(curr, prev) {

            if(prev.size > curr.size) {
              return;
            }

            streamData(filePath, prev.size, curr.size, socket);

            // All well, mark this file as last one
            lastFilePath = filePath;
          });
        });

        // stop watching the file
        socket.on('disconnect', unwatch);
      });
    };
  }

  module.exports = onConnect;

}).call();