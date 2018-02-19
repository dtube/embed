import document from 'global/document';
import videojs from 'video.js';
import ContextMenu from './context-menu';
import {getPointerPosition} from './util';

// support VJS5 & VJS6 at the same time
const registerPlugin = videojs.registerPlugin || videojs.plugin;

/**
 * Whether or not the player has an active context menu.
 *
 * @param  {Player} player
 * @return {Boolean}
 */
function hasMenu(player) {
  return player.hasOwnProperty('contextmenuUI') &&
    player.contextmenuUI.hasOwnProperty('menu') &&
    player.contextmenuUI.menu.el();
}

/**
 * Calculates the position of a menu based on the pointer position and player
 * size.
 *
 * @param  {Object} pointerPosition
 * @param  {Object} playerSize
 * @return {Object}
 */
function findMenuPosition(pointerPosition, playerSize) {
  return {
    left: Math.round(playerSize.width * pointerPosition.x),
    top: Math.round(playerSize.height - (playerSize.height * pointerPosition.y))
  };
}

/**
 * Handles vjs-contextmenu events.
 *
 * @param  {Event} e
 */
function onVjsContextMenu(e) {

  // If this event happens while the custom menu is open, close it and do
  // nothing else. This will cause native contextmenu events to be intercepted
  // once again; so, the next time a contextmenu event is encountered, we'll
  // open the custom menu.
  if (hasMenu(this)) {
    this.contextmenuUI.menu.dispose();
    return;
  }

  // Stop canceling the native contextmenu event until further notice.
  this.contextmenu.options.cancel = false;

  // Calculate the positioning of the menu based on the player size and
  // triggering event.
  const pointerPosition = getPointerPosition(this.el(), e);
  const playerSize = this.el().getBoundingClientRect();
  const menuPosition = findMenuPosition(pointerPosition, playerSize);

  e.preventDefault();

  const menu = this.contextmenuUI.menu = new ContextMenu(this, {
    content: this.contextmenuUI.content,
    position: menuPosition
  });

  // This is for backward compatibility. We no longer have the `closeMenu`
  // function, but removing it would necessitate a major version bump.
  this.contextmenuUI.closeMenu = () => {
    videojs.warn('player.contextmenuUI.closeMenu() is deprecated, please use player.contextmenuUI.menu.dispose() instead!');
    menu.dispose();
  };

  menu.on('dispose', () => {
    // Begin canceling contextmenu events again, so subsequent events will
    // cause the custom menu to be displayed again.
    this.contextmenu.options.cancel = true;
    videojs.off(document, ['click', 'tap'], menu.dispose);
    this.removeChild(menu);
    delete this.contextmenuUI.menu;
  });

  this.addChild(menu);
  videojs.on(document, ['click', 'tap'], menu.dispose);
}

/**
 * Creates a menu for videojs-contextmenu abstract event(s).
 *
 * @function contextmenuUI
 * @param    {Object} options
 * @param    {Array}  options.content
 *           An array of objects which populate a content list within the menu.
 */
function contextmenuUI(options) {
  if (!Array.isArray(options.content)) {
    throw new Error('"content" required');
  }

  // If we have already invoked the plugin, teardown before setting up again.
  if (hasMenu(this)) {
    this.contextmenuUI.menu.dispose();
    this.off('vjs-contextmenu', this.contextmenuUI.onVjsContextMenu);

    // Deleting the player-specific contextmenuUI plugin function/namespace will
    // restore the original plugin function, so it can be called again.
    delete this.contextmenuUI;
  }

  // If we are not already providing "vjs-contextmenu" events, do so.
  this.contextmenu();

  // Wrap the plugin function with an player instance-specific function. This
  // allows us to attach the menu to it without affecting other players on
  // the page.
  const cmui = this.contextmenuUI = function() {
    contextmenuUI.apply(this, arguments);
  };

  cmui.onVjsContextMenu = videojs.bind(this, onVjsContextMenu);
  cmui.content = options.content;
  cmui.VERSION = '__VERSION__';

  this.on('vjs-contextmenu', cmui.onVjsContextMenu);
  this.ready(() => this.addClass('vjs-contextmenu-ui'));
}

registerPlugin('contextmenuUI', contextmenuUI);
contextmenuUI.VERSION = '__VERSION__';

export default contextmenuUI;
