(function(f){if(typeof exports==="object"&&typeof module!=="undefined"){module.exports=f()}else if(typeof define==="function"&&define.amd){define([],f)}else{var g;if(typeof window!=="undefined"){g=window}else if(typeof global!=="undefined"){g=global}else if(typeof self!=="undefined"){g=self}else{g=this}g.videojsBrand = f()}})(function(){var define,module,exports;return (function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
(function (global){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

var _videoJs = (typeof window !== "undefined" ? window['videojs'] : typeof global !== "undefined" ? global['videojs'] : null);

var _videoJs2 = _interopRequireDefault(_videoJs);

var defaults = {
  branding: true,
  qualities: [],
  title: "Logo Title",
  destination: "http://www.google.com",
  destinationTarget: "_blank"
};

var onPlayerReady = function onPlayerReady(player, options) {

  // if (options.qualities.length > 1) {
  //   var MenuButton = videojs.getComponent('MenuButton');
  //   var MenuItem = videojs.getComponent('MenuItem');

  //   var settingsButton = new MenuButton(player)
  //   settingsButton.addClass("quality-button")
  //   settingsButton.addClass("vjs-audio-button")
    
  //   var settingsMenu = settingsButton.createMenu()
  //   var qualities = options.qualities

  //   for (var q = 0; q < qualities.length; q++) {
  //     var menuItem = new MenuItem(player, {
  //       label: qualities[q].label
  //     })

  //     if (qualities[q].src == document.getElementsByTagName('video')[0].src)
  //       menuItem.addClass("vjs-selected")

  //     menuItem.addClass("quality-item")

  //     settingsMenu.addChild(menuItem)
  //   }
  //   settingsButton.addChild(settingsMenu)
  //   player.controlBar.el().insertBefore(settingsButton.el(), player.controlBar.fullscreenToggle.el());
    
  //   for (var q = 0; q < document.getElementsByClassName('quality-item').length; q++) {
  //     document.getElementsByClassName('quality-item')[q].addEventListener("click", function( event ) {
  //       var quality = '';
  //       if (event.target.innerHTML.length > 10)
  //         quality = event.target.getElementsByClassName('vjs-menu-item-text')[0].innerHTML
  //       else quality = event.target.innerHTML
        
  //       for (let index = 0; index < qualities.length; index++) {
  //         if (qualities[index].label == quality) {
  //           var currentTime = player.currentTime()
  //           document.getElementsByTagName('video')[0].src = qualities[index].src
  //           player.play()
  //           player.currentTime(currentTime)
  //           if (document.getElementsByClassName('quality-item vjs-selected').length > 0)
  //             document.getElementsByClassName('quality-item vjs-selected')[0].classList.remove("vjs-selected")
  //           console.log(event.target)
  //           if (event.target.innerHTML.length > 10)
  //             event.target.classList.add("vjs-selected")
  //           else event.target.parentElement.classList.add("vjs-selected")
  //         }            
  //       }
  //     }, false);
  //   }
  //   document.getElementsByClassName('quality-button')[0].addEventListener("click", function( event ) {
  //     console.log('Switch to next quality')
  //   }, false);
  // }

  if (options.branding) {
    var containerElement = document.createElement("div");
    containerElement.className = "vjs-fullscreen-control vjs-control vjs-button";
    containerElement.style = 'width:86px'
  
    var linkElement = document.createElement("a");
    linkElement.className = "vjs-play-control vjs-control vjs-branding-logo";
    linkElement.setAttribute("href", options.destination || defaults.destination);
    linkElement.setAttribute("title", options.title || defaults.title);
    linkElement.setAttribute("target", options.destinationTarget || defaults.destinationTarget);
    linkElement.style = 'width:86px'
    containerElement.appendChild(linkElement);
  
    player.controlBar.el().insertBefore(containerElement, player.controlBar.fullscreenToggle.el());
    player.addClass('vjs-brand');
  }
  
};

var brand = function brand(options) {
  var _this = this;
  this.ready(function () {
    onPlayerReady(_this, _videoJs2["default"].mergeOptions(defaults, options));
  });
};

_videoJs2["default"].plugin('brand', brand);
brand.VERSION = '0.0.4';

exports["default"] = brand;
module.exports = exports["default"];
}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{}]},{},[1])(1)
});
