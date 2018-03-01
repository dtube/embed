"use strict";
(function(factory){
  if (typeof define === 'function' && define['amd']) {
    define(['./video'], function(vjs){ factory(window, document, vjs) });
  } else if (typeof exports === 'object' && typeof module === 'object') {
    factory(window, document, require('video.js'));
  } else {
    factory(window, document, videojs);
  }

})(function(window, document, vjs) {
  var defaults = {}

  var volumePersister = function(options) {
    var player = this;
    var settings = extend({}, defaults, options || {});

    var key = 'dvolume';
    var muteKey = 'dmute';

    player.on("volumechange", function() {
      setStorageItem(key, player.volume());
      setStorageItem(muteKey, player.muted());
    });

    var persistedVolume = getStorageItem(key);
    if(persistedVolume !== null){
      player.volume(persistedVolume);
    }

    var persistedMute = getStorageItem(muteKey);
    if(persistedMute !== null){
      player.muted('true' === persistedMute);
    }
  };

  vjs.registerPlugin("persistvolume", volumePersister);

});