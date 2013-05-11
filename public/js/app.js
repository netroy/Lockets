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

  var scrollToggle = $('#scrollToggle');
  scrollToggle.click(function() {
    scrollToggle.toggleClass('down');
    if ($(this).hasClass("down")) {
      $(this).html("Enable auto-scroll");
    }else{
      $(this).html("Disable auto-scroll");
    }
  });

  // highlight matches
  var filterBox = $('#filter');
  filterBox.bind('input', function() {

    var matcher = filterBox.val();
    var lis = buffer.find('li');

    if(!matcher.length) {
      lis.removeClass('matching');
    } else {
      lis.each(function(index, li) {
        var isMatching = new RegExp(matcher, 'ig').test(li.innerText);
        $(li).toggleClass('matching', isMatching);
      });
    }
  });

  var log = console.log.bind(console, 'TAIL');

  var socket  = io.connect();
  socket.on('connect', function() {
    log('Connected');
  });

  var selector = $('#selector select');
  socket.on('list', function(logFiles) {
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
        $('#info, #tail').empty();
        return;
      }

      buffer.empty();
      socket.emit('request', log.options[log.selectedIndex].value);
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

    if(!scrollToggle.hasClass('down')) {
      buffer.scrollTop(lines * 100);
    }

    lines = lines + backLog.length;
  });

  socket.on('clear', function() {
    buffer.empty();
  });

  socket.on('err', log);

  socket.on('message', log);
});