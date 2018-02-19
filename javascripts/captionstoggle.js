var Button = videojs.getComponent('Button');
/**
 * The component for controlling the settings menu
 * @param {Player|Object} player
 * @param {Object=} options
 * @extends Button
 * @class CaptionsToogle
 */
class CaptionsToogle extends Button {

    constructor(player, options) {
        super(player, options);
        this.el_.setAttribute('aria-label', 'Toggle Captions');
        this.on('click', videojs.bind(this, this.toggleCaptions));
    }

    /**
     * Allow sub components to stack CSS class names
     * @return {String} The constructed class name
     * @method buildCSSClass
     */
    buildCSSClass() {
        return `vjs-captions-button ${super.buildCSSClass()}`;
    }

    toggleCaptions() {
        var tracks = videojs("player").player().textTracks(),
            track, i;
        for (i = 0; i < tracks.length; i++) {
            track = tracks[i];
            if (track.kind === 'captions' &&
                track.language) {
                if (track.mode !== 'showing') {
                    track.mode = 'showing';
                    // this.addClass('vjs-selected');
                    this.addClass('vjs-dtube-selected');
                } else {
                    track.mode = 'hidden';
                    //  this.removeClass('vjs-selected');
                    this.removeClass('vjs-dtube-selected');
                }
                return;
            } else {
                track.mode = 'hidden';
            }
        }
        videojs.log('No captions !');
        this.addClass('hidden');
        return;
    }

}

CaptionsToogle.prototype.controlText_ = 'Toggle Captions';

Component.registerComponent('CaptionsToogle', CaptionsToogle);
// export default CaptionsToogle;