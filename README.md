# DTube Embed Player

This is the main video player of d.tube. It is hosted directly on github pages for simplicity. You can pass options to the player through the url hash fragment:

The syntax is as follow `/#!/author/permlink/autoplay/branding`

* Author: the steem username of the account associated with the content
* Permlink: the permlink of the steem content, or 'live' for the user livestream
* Autoplay: true/false, default to false. If true, the video will start playing without click
* Branding: true/false, default to false. If true, the DTube logo will be hidden
 
Example:
 
[https://emb.d.tube/#!/elsiekjay/QmQXCBVvVn6WRCuxV3K2FoYLX6F98TvWYPorJEdEyz7VPr/true](https://emb.d.tube/#!/elsiekjay/QmQXCBVvVn6WRCuxV3K2FoYLX6F98TvWYPorJEdEyz7VPr/true) -> will autoplay and keep dtube branding

Autoplay is not always going to happen. It depends on the media engagement, see chrome://media-engagement
