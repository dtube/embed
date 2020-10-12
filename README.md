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