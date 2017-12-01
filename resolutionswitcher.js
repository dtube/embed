/*! videojs-resolution-switcher - 2015-7-26
 * Copyright (c) 2016 Kasper Moskwiak
 * Modified by Pierre Kraft and Derk-Jan Hartman
 * Licensed under the Apache-2.0 license. */

(function() {
    /* jshint eqnull: true*/
    /* global require */
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
  
      /*
       * Resolution menu item
       */
      var MenuItem = videojs.getComponent('MenuItem');
      var ResolutionMenuItem = videojs.extend(MenuItem, {
        constructor: function(player, options){
          options.selectable = true;
          // Sets this.player_, this.options_ and initializes the component
          MenuItem.call(this, player, options);
          this.src = options.src;
  
          player.on('resolutionchange', videojs.bind(this, this.update));
        }
      } );
      ResolutionMenuItem.prototype.handleClick = function(event){
        MenuItem.prototype.handleClick.call(this,event);
        this.player_.currentResolution(this.options_.label);
      };
      ResolutionMenuItem.prototype.update = function(){
        var selection = this.player_.currentResolution();
        this.selected(this.options_.label === selection.label);
      };
      MenuItem.registerComponent('ResolutionMenuItem', ResolutionMenuItem);
  
      /*
       * Resolution menu button
       */
      var MenuButton = videojs.getComponent('MenuButton');
      var ResolutionMenuButton = videojs.extend(MenuButton, {
        constructor: function(player, options){
          this.label = document.createElement('span');
          options.label = 'Quality';
          // Sets this.player_, this.options_ and initializes the component
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
  
        // FIXME order is not guaranteed here.
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
  
      /**
       * Initialize the plugin.
       * @param {object} [options] configuration for the plugin
       */
      videoJsResolutionSwitcher = function(options) {
        var settings = videojs.mergeOptions(defaults, options),
            player = this,
            groupedSrc = {},
            currentSources = {},
            currentResolutionState = {};
  
        /**
         * Updates player sources or returns current source URL
         * @param   {Array}  [src] array of sources [{src: '', type: '', label: '', res: ''}]
         * @returns {Object|String|Array} videojs player object if used as setter or current source URL, object, or array of sources
         */
        player.updateSrc = function(src){
          //Return current src if src is not given
          if(!src){ return player.src(); }
  
          // Only add those sources which we can (maybe) play
          src = src.filter( function(source) {
            try {
              return ( player.canPlayType( source.type ) !== '' );
            } catch (e) {
              // If a Tech doesn't yet have canPlayType just add it
              return true;
            }
          });
          //Sort sources
          this.currentSources = src.sort(compareResolutions);
          this.groupedSrc = bucketSources(this.currentSources);
          // Pick one by default
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
  
        /**
         * Returns current resolution or sets one when label is specified
         * @param {String}   [label]         label name
         * @param {Function} [customSourcePicker] custom function to choose source. Takes 2 arguments: sources, label. Must return player object.
         * @returns {Object}   current resolution object {label: '', sources: []} if used as getter or player object if used as setter
         */
        player.currentResolution = function(label, customSourcePicker){
          if(label == null) { return this.currentResolutionState; }
  
          // Lookup sources for label
          if(!this.groupedSrc || !this.groupedSrc.label || !this.groupedSrc.label[label]){
            return;
          }
          var sources = this.groupedSrc.label[label];
          // Remember player state
          var currentTime = player.currentTime();
          var isPaused = player.paused();
  
          // Hide bigPlayButton
          if(!isPaused && this.player_.options_.bigPlayButton){
            this.player_.bigPlayButton.hide();
          }
  
          // Change player source and wait for loadeddata event, then play video
          // loadedmetadata doesn't work right now for flash.
          // Probably because of https://github.com/videojs/video-js-swf/issues/124
          // If player preload is 'none' and then loadeddata not fired. So, we need timeupdate event for seek handle (timeupdate doesn't work properly with flash)
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
                // Start playing
                player.play();
              }
              player.trigger('resolutionchange');
            });
          return player;
        };
  
        /**
         * Returns grouped sources by label, resolution and type
         * @returns {Object} grouped sources: { label: { key: [] }, res: { key: [] }, type: { key: [] } }
         */
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
  
        /**
         * Method used for sorting list of sources
         * @param   {Object} a - source object with res property
         * @param   {Object} b - source object with res property
         * @returns {Number} result of comparation
         */
        function compareResolutions(a, b){
          if(!a.res || !b.res){ return 0; }
          return (+b.res)-(+a.res);
        }
  
        /**
         * Group sources by label, resolution and type
         * @param   {Array}  src Array of sources
         * @returns {Object} grouped sources: { label: { key: [] }, res: { key: [] }, type: { key: [] } }
         */
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
  
        /**
         * Choose src if option.default is specified
         * @param   {Object} groupedSrc {res: { key: [] }}
         * @param   {Array}  src Array of sources sorted by resolution used to find high and low res
         * @returns {Object} {res: string, sources: []}
         */
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
  
      // register the plugin
      videojs.registerPlugin('videoJsResolutionSwitcher', videoJsResolutionSwitcher);
    })(window, videojs);
  })();