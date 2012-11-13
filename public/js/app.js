/*global $, window, io, Option, console*/
$(function() {

  'use strict';

  var lines = 0;
  var notice = $('#info');
  var buffer = $('#tail');

  var $win = $(window);
  function rescale(){
    buffer.height($win.height()-120);
  }
  $win.resize(rescale);
  rescale();

  var log = console.log.bind(console, 'TAIL');

  var socket  = io.connect();
  socket.on('connect', function() {
    log('Connected');
  });

  socket.on('list', function(logFiles) {
    var selector = $("#selector select");
    $.each(logFiles, function() {
      var log = new Option(this,this);
      if ($.browser.msie) {
        selector[0].add(log);
      } else {
        selector[0].add(log,null);
      }
    });

    selector.bind('change',function(e){
      var log = selector[0];
      if(log.selectedIndex === 0){
        $("#info,#tail").empty();
        return;
      }
      socket.emit('message', {
        'log':log.options[log.selectedIndex].value
      });
    });
  });

  socket.on('select', function(fileName) {
    notice.html('watching ' + fileName);
  });

  socket.on('tail', function(backLog) {

    $.each(backLog, function(index, entry) {

      if(!entry) {
        return;
      }

      var li = $('<li>');
      li.text(entry);
      buffer.append(li);
    });

    buffer.scrollTop(lines * 100);
    lines = lines + backLog.length;
  });

  socket.on('clear', function() {
    buffer.empty();
  });

  socket.on('message', log);
});