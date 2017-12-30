

const MenuButton = videojs.getComponent('MenuButton');
const Menu = videojs.getComponent('Menu');
const Component = videojs.getComponent('Component');

/**
 * The component for controlling the settings menu
 *
 * @param {Player|Object} player
 * @param {Object=} options
 * @extends MenuButton
 * @class SettingsMenuButton
 */
class SettingsMenuButton extends MenuButton {

  constructor(player, options) {
    super(player, options);

    this.el_.setAttribute('aria-label', 'Settings Menu');

    this.on('mouseleave', videojs.bind(this, this.hideChildren));
  }

  /**
   * Allow sub components to stack CSS class names
   *
   * @return {String} The constructed class name
   * @method buildCSSClass
   */
  buildCSSClass() {
    // vjs-icon-cog can be removed when the settings menu is integrated in video.js
    return `vjs-settings-menu vjs-icon-cog ${super.buildCSSClass()}`;
  }

  /**
   * Create the settings menu
   *
   * @return {Menu} Menu object populated with items
   * @method createMenu
   */
  createMenu() {
    let menu = new Menu(this.player());
    let entries = this.options_.entries;

    if (entries) {

      const openSubMenu = function() {

        if (videojs.dom.hasClass(this.el_, 'open')) {
          videojs.dom.removeClass(this.el_, 'open');
        } else {
          videojs.dom.addClass(this.el_, 'open');
        }

      };

      for (let entry of entries) {

        let settingsMenuItem = new SettingsMenuItem(this.player(), this.options_, entry);

        menu.addChild(settingsMenuItem);

        // Hide children to avoid sub menus stacking on top of each other
        // or having multiple menus open
        settingsMenuItem.on('click', videojs.bind(this, this.hideChildren));

        // Wether to add or remove selected class on the settings sub menu element
        settingsMenuItem.on('click', openSubMenu);
      }
    }

    return menu;
  }

  /**
   * Hide all the sub menus
   */
  hideChildren() {
    for (let menuChild of this.menu.children()) {
      menuChild.hideSubMenu();
    }
  }

}

SettingsMenuButton.prototype.controlText_ = 'Settings Menu';

Component.registerComponent('SettingsMenuButton', SettingsMenuButton);
// export default SettingsMenuButton;
