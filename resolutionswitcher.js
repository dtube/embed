/*! videojs-resolution-switcher - 2015-7-26
 * Copyright (c) 2016 Kasper Moskwiak
 * Modified by Pierre Kraft and Derk-Jan Hartman
 * Licensed under the Apache-2.0 license. 
 * https://github.com/kmoskwiak/videojs-resolution-switcher */

(function() {
  'use strict';
  var videojs = null;
  if(typeof window.videojs === 'undefined' && typeof require === 'function') {
    videojs = require('video.js');
  } else {
    videojs = window.videojs;
  }

  (function(window, videojs) {
    var videoJsResolutionSwitcher,
      defaults = {
        ui: true
      };

    var MenuItem = videojs.getComponent('MenuItem');
    var ResolutionMenuItem = videojs.extend(MenuItem, {
      constructor: function(player, options){
        options.selectable = true;
        MenuItem.call(this, player, options);
        this.src = options.src;

        player.on('resolutionchange', videojs.bind(this, this.update));
      }
    } );
    ResolutionMenuItem.prototype.handleClick = function(event){
      findBestUrl(this.options_.src[0].hash, function(url) {
        for (let i = 0; i < qualities.length; i++) {
          if (qualities[i].label !== this.options_.label) return
          qualities[i].src = url
        }
        player.updateSrc(qualities)
      })
      MenuItem.prototype.handleClick.call(this,event);
      this.player_.currentResolution(this.options_.label);
    };
    ResolutionMenuItem.prototype.update = function(){
      var selection = this.player_.currentResolution();
      this.selected(this.options_.label === selection.label);
    };
    MenuItem.registerComponent('ResolutionMenuItem', ResolutionMenuItem);

    var MenuButton = videojs.getComponent('MenuButton');
    var ResolutionMenuButton = videojs.extend(MenuButton, {
      constructor: function(player, options){
        this.label = document.createElement('span');
        options.label = 'Quality';
        MenuButton.call(this, player, options);
        this.el().setAttribute('aria-label','Quality');
        this.controlText('Quality');
        this.addClass('vjs-resolution-switcher')

        videojs.dom.addClass(this.label, 'vjs-resolution-button-label');
        
        this.label.addEventListener("click", function(){
          var cur = player.currentResolutionState.label
          var i = 1;
          while (cur != player.currentSources[i-1].label)
            i++
          if (i == player.currentSources.length)
            i=0
          player.currentResolution(player.currentSources[i].label)
        });
        this.el().appendChild(this.label);

        player.on('updateSources', videojs.bind( this, this.update ) );
        player.on('resolutionchange', videojs.bind(this, this.update));
      }
    } );
    ResolutionMenuButton.prototype.createItems = function(){
      var menuItems = [];
      var labels = (this.sources && this.sources.label) || {};

      for (var key in labels) {
        if (labels.hasOwnProperty(key)) {
          menuItems.push(new ResolutionMenuItem(
            this.player_,
            {
              label: key,
              src: labels[key],
              selected: key === (this.currentSelection ? this.currentSelection.label : false)
            })
          );
        }
      }
      return menuItems;
    };
    ResolutionMenuButton.prototype.update = function(){
      this.sources = this.player_.getGroupedSrc();
      this.currentSelection = this.player_.currentResolution();
      this.label.innerHTML = this.currentSelection ? this.currentSelection.label : '';
      return MenuButton.prototype.update.call(this);
    };
    ResolutionMenuButton.prototype.buildCSSClass = function(){
      return MenuButton.prototype.buildCSSClass.call( this ) + ' vjs-resolution-button';
    };
    MenuButton.registerComponent('ResolutionMenuButton', ResolutionMenuButton);

    videoJsResolutionSwitcher = function(options) {
      var settings = videojs.mergeOptions(defaults, options),
          player = this,
          groupedSrc = {},
          currentSources = {},
          currentResolutionState = {};

      player.updateSrc = function(src){
        if(!src){ return player.src(); }

        src = src.filter( function(source) {
          try {
            return ( player.canPlayType( source.type ) !== '' );
          } catch (e) {
            return true;
          }
        });
        this.currentSources = src.sort(compareResolutions);
        this.groupedSrc = bucketSources(this.currentSources);
        var chosen = chooseSrc(this.groupedSrc, this.currentSources);
        this.currentResolutionState = {
          label: chosen.label,
          sources: chosen.sources
        };
        chosen.sources = []
        for (let i = 0; i < this.currentSources.length; i++) {
          if (this.currentSources[i].label == chosen.label)
            chosen.sources.push(this.currentSources[i]) 
        }

        player.trigger('updateSources');
        player.setSourcesSanitized(chosen.sources, chosen.label);
        player.trigger('resolutionchange');
        return player;
      };

      player.currentResolution = function(label, customSourcePicker){
        if(label == null) { return this.currentResolutionState; }

        if(!this.groupedSrc || !this.groupedSrc.label || !this.groupedSrc.label[label]){
          return;
        }
        var sources = this.groupedSrc.label[label];
        var currentTime = player.currentTime();
        var isPaused = player.paused();

        if(!isPaused && this.player_.options_.bigPlayButton){
          this.player_.bigPlayButton.hide();
        }

        var handleSeekEvent = 'loadeddata';
        if(this.player_.preload() === 'none') {
          handleSeekEvent = 'timeupdate';
        }
        player
          .setSourcesSanitized(sources, label, customSourcePicker || settings.customSourcePicker)
          .one(handleSeekEvent, function() {
            player.currentTime(currentTime);
            player.handleTechSeeked_();
            if(!isPaused){
              player.play();
            }
            player.trigger('resolutionchange');
          });
        return player;
      };

      player.getGroupedSrc = function(){
        return this.groupedSrc;
      };

      player.setSourcesSanitized = function(sources, label, customSourcePicker) {
        this.currentResolutionState = {
          label: label,
          sources: sources
        };
        if(typeof customSourcePicker === 'function'){
          return customSourcePicker(player, sources, label);
        }
        player.src(sources.map(function(src) {
          return {src: src.src, type: src.type, res: src.res};
        }));
        return player;
      };

      function compareResolutions(a, b){
        if(!a.res || !b.res){ return 0; }
        return (+b.res)-(+a.res);
      }

      function bucketSources(src){
        var resolutions = {
          label: {},
          res: {},
          type: {}
        };
        src.map(function(source) {
          initResolutionKey(resolutions, 'label', source);
          initResolutionKey(resolutions, 'res', source);
          initResolutionKey(resolutions, 'type', source);

          appendSourceToKey(resolutions, 'label', source);
          appendSourceToKey(resolutions, 'res', source);
          appendSourceToKey(resolutions, 'type', source);
        });
        return resolutions;
      }

      function initResolutionKey(resolutions, key, source) {
        if(resolutions[key][source[key]] == null) {
          resolutions[key][source[key]] = [];
        }
      }

      function appendSourceToKey(resolutions, key, source) {
        resolutions[key][source[key]].push(source);
      }

      function chooseSrc(groupedSrc, src){
          var obj = {
              res: settings['default'],
              label: settings['default'],
              sources: groupedSrc.res[settings['default']]
          }
          return obj;
      }


      player.ready(function(){
        if( settings.ui ) {
          var menuButton = new ResolutionMenuButton(player, settings);
          player.controlBar.resolutionSwitcher = player.controlBar.el_.insertBefore(menuButton.el_, player.controlBar.getChild('fullscreenToggle').el_);
          player.controlBar.resolutionSwitcher.dispose = function(){
            this.parentNode.removeChild(this);
          };
        }
        if(player.options_.sources.length > 1){
          player.updateSrc(player.options_.sources);
        }
      });

    };

    videojs.registerPlugin('videoJsResolutionSwitcher', videoJsResolutionSwitcher);
  })(window, videojs);
})();