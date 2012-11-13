// ===================================
// `tail -f` in Node.js and WebSockets
// ===================================

(function() {

  'use strict';

  var socketIO = require('socket.io');
  var optmist = require('optimist');
  var connect = require('connect');
  var stylus  = require('stylus');

  var http = require('http');
  var fs = require('fs');
  var path = require('path');

  // Directory to watch
  var logDir = process.argv.length > 2 ? process.argv[2] :  "/tmp";

  // Create an connect app
  var app = connect();

  // Setup Socket.IO
  var httpServer = http.createServer(app);
  var io = socketIO.listen(httpServer);
  io.set('log level', 1);


  // Stylesheets
  var baseDir = path.join(__dirname, 'public');
  app.use(stylus.middleware({
    'src': baseDir
  }));

  // Other static content
  app.use(connect['static'](baseDir));


  // Fetch list of files & start watching
  require('./lib/list-files')(logDir, function(err, logFiles) {

    if(err) {
      throw err;
    }

    io.sockets.on('connection', require('./lib/io-handler')(logDir, logFiles));

    var port = parseInt(process.env.PORT || 8000, 10);
    httpServer.listen(port);

    console.log('Log Server running now \n\thttp://0.0.0.0:' + port + '/');
  });

  module.exports = httpServer;

}).call();