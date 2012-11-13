/*global require, module*/
(function() {

  'use strict';

  var fs = require('fs');
  var path = require('path');

  module.exports = function populate(logDir, callback) {

    // look up the dir for logs
    fs.readdir(logDir, function(err, files){

      if(err) {
        return callback(err);
      }

      var logFiles = [];

      // Fix the Array
      files = Array.prototype.sort.apply(files,[]);

      files.forEach(function(file) {
        var filePath = path.join(logDir, file);
        var isFile = fs.statSync(filePath).isFile();
        if(isFile) {
          logFiles.push(file);
        }
      });

      callback(null, logFiles);
    });
  };

}).call();