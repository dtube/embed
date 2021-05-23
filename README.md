# DTube Embed Player

This is the main video player of d.tube. It is hosted directly on github pages for simplicity. You can pass options to the player through the url hash fragment:

The syntax is as follow `/#!/author/permlink/autoplay/branding`

* Author: the steem username of the account associated with the content
* Permlink: the permlink of the steem content, or 'live' for the user livestream
* Autoplay: true/false, default to false. If true, the video will start playing without click
* Modest Branding: true/false, default to false. If true, the DTube logo will be hidden

There are also two optional arguments which can be attached to the url if needed:

`/#!/author/permlink/autoplay/branding/provider/additionalOptions`

* provider: Can be used to specify a provider the player should use. For a list of supported providers see below. Can be set to `default` use the recommended settings.
* additionalOptions: This is a URL-style key-value string which can be used to pass additional preferences to the player. For a list of currently implemented options see below.

## Examples
 
[https://emb.d.tube/#!/elsiekjay/QmQXCBVvVn6WRCuxV3K2FoYLX6F98TvWYPorJEdEyz7VPr/true](https://emb.d.tube/#!/elsiekjay/QmQXCBVvVn6WRCuxV3K2FoYLX6F98TvWYPorJEdEyz7VPr/true) -> will autoplay and keep dtube branding

Autoplay is not always going to happen. It depends on the media engagement, see chrome://media-engagement

[https://emb.d.tube/#!/elsiekjay/QmQXCBVvVn6WRCuxV3K2FoYLX6F98TvWYPorJEdEyz7VPr/true/false/default/loop=true](https://emb.d.tube/#!/elsiekjay/QmQXCBVvVn6WRCuxV3K2FoYLX6F98TvWYPorJEdEyz7VPr/true/default/loop=true) -> will autoplay, keep dtube branding and also loop at the end, whilest using the recommended provider


## Supported Providers

First-Party: 

* IPFS
* BTFS
* Skynet

Third-Party:

* Twitch
* Dailymotion
* Instagram
* LiveLeak
* Vimeo
* Facebook
* YouTube

## Additional Options

| Key    | Value                 | Explanation                               |
|--------|-----------------------|-------------------------------------------|
| loop   | `true` / `false`      | Makes the video loop at the end. Currently not supported for: Twitch, Dailymotion, Instagram, LiveLeak and Facebook |

## JavaScript API

The embedded player can be controlled using JavaScript in compliance with the [Player.js specification](https://github.com/embedly/player.js/blob/master/SPEC.rst). You can use [Player.js](https://github.com/embedly/player.js#playerjs) as a library to control the player.

Simply load the Player.js library:
```html
<script type="text/javascript" src="//cdn.embed.ly/player-0.1.0.min.js"></script>
```

After this you can initialize the library using the ID of the iframe:

```javascript
const player = new playerjs.Player('your-iframe');
```

You can then call a variety of methods suchs as `player.play()` or `player.setVolume(20)`.

For a full list of methods see: https://github.com/embedly/player.js#methods

For a full list of events see: https://github.com/embedly/player.js#events
