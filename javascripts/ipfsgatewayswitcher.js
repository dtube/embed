/*
// Modified by techcoderx from resolutionswitcher.js
// https://github.com/dtube/embed/blob/master/javascripts/resolutionswitcher.js
*/

(function() {
    'use strict';
    var videojs = null;
    if (typeof window.videojs === 'undefined' && typeof require === 'function') {
        videojs = require('video.js');
    } else {
        videojs = window.videojs;
    }

    (function(window, videojs) {
        var IPFSGatewaySwitcher,
            defaults = {
                ui: true
            };
        const Component = videojs.getComponent('Component');
        var MenuItem = videojs.getComponent('MenuItem');
        var GatewayMenuItem = videojs.extend(MenuItem, {
            constructor: function(player, options) {
                options.selectable = true;
                MenuItem.call(this, player, options);
                this.src = options.src;
            }
        })
        GatewayMenuItem.prototype.handleClick = function(event) {
            // Update source in resolution switcher plugin with selected gateway
            let newgw = event.target.innerText.replace(', selected','')
            let sourcesToChange = player.options_.sources

            console.log(newgw)

            for (let i = 0; i < sourcesToChange.length; i++) {
                sourcesToChange[i].src = newgw + '/ipfs/' + sourcesToChange[i].hash
            }

            console.log('New sources',sourcesToChange)
            console.log('Gateways changed to ' + event.target.innerText)
            document.getElementsByClassName('vjs-settings-sub-menu-value')[document.getElementsByClassName('vjs-settings-sub-menu-value').length - 1].innerHTML = newgw
            player.updateSrc(sourcesToChange)
        };
        
        MenuItem.registerComponent('GatewayMenuItem', GatewayMenuItem);

        var MenuButton = videojs.getComponent('MenuButton');
        var GatewaySwitcherMenuButton = videojs.extend(MenuButton, {
            constructor: function(player, options) {
                this.label = document.createElement('span');
                options.label = 'Gateway';
                MenuButton.call(this, player, options);
                this.el().setAttribute('aria-label', 'Gateway');
                this.controlText('Gateway');
                this.controlText_ = 'Gateway'
                this.addClass('vjs-resolution-switcher')

                videojs.dom.addClass(this.label, 'vjs-resolution-button-label');
                this.el().appendChild(this.label);
            }
        });
        GatewaySwitcherMenuButton.prototype.createItems = function() {
            let menuItems = [];

            for (let i = 0; i < window.gateways.length; i++) {
                menuItems.push(new GatewayMenuItem(
                    this.player_, {
                        label: window.gateways[i]
                    }
                ))
            }

            return menuItems;
        };
        
        GatewaySwitcherMenuButton.prototype.buildCSSClass = function() {
            return MenuButton.prototype.buildCSSClass.call(this) + ' vjs-resolution-button';
        };
        MenuButton.registerComponent('GatewaySwitcherMenuButton', GatewaySwitcherMenuButton);

        IPFSGatewaySwitcher = function(options) {
            let settings = videojs.mergeOptions(defaults, options),
                player = this

            player.ready(function() {
                if (settings.ui) {
                    let menuButton = new GatewaySwitcherMenuButton(player, settings)
                    player.controlBar.gatewaySwitcher = player.controlBar.el_.insertBefore(menuButton.el_, player.controlBar.getChild('fullscreenToggle').el_)
                    player.controlBar.gatewaySwitcher.dispose = function() {
                        this.parentNode.removeChild(this)
                    };
                }
            })

        };

        videojs.registerPlugin('IPFSGatewaySwitcher', IPFSGatewaySwitcher);
    })(window, videojs);
})();