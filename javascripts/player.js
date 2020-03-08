portals = {
    IPFS: [
        "https://video.dtube.top/ipfs/",
        "https://video.oneloveipfs.com/ipfs/",
        "https://ipfs.busy.org/ipfs/",
        "https://ipfsgateway.makingblocks.xyz/ipfs/",
        "https://ipfs.io/ipfs/",
        "https://ipfs.infura.io/ipfs/",
        "https://gateway.temporal.cloud/ipfs/",
        "https://gateway.pinata.cloud/ipfs/",
        "https://ipfs.eternum.io/ipfs/"
    ],
    BTFS: [
        "https://player.d.tube/btfs/",
        "https://btfs.d.tube/btfs/"
    ],
    Skynet: [
        "https://siasky.net/",
        "https://skydrain.net/",
        "https://sialoop.net/",
        "https://skynet.luxor.tech/",
        "https://skynet.tutemwesi.com/",
        "https://siacdn.com/",
        "https://vault.lightspeedhosting.com/"
    ]
}
steemAPI = [
    "https://api.steemit.com/",
    "https://techcoderx.com",
    "https://steemd.minnowsupportproject.org/",
    "https://anyx.io/",
    "https://steemd.privex.io",
    "https://api.steem.house"
]
avalonAPI = 'https://avalon.d.tube'
IpfsShortTermGw = 'https://video.dtube.top'
BtfsShortTermGw = "https://player.d.tube"
player = null
itLoaded = false
timeout = 1500
var path = window.location.href.split("#!/")[1];
var videoAuthor = path.split("/")[0]
var videoPermlink = path.split("/")[1]
var autoplay = (path.split("/")[2] == 'true')
var nobranding = (path.split("/")[3] == 'true')
provider = path.split("/")[4]

document.addEventListener("DOMContentLoaded", function(event) {
    startup()
});

function startup() {
    // if you don't pass anything in the first field (emb.d.tube/#!//)
    // you can pass JSOUN data in the second field
    // and skip blockchain loading time
    if (videoAuthor === '') {
        try {
            var json = JSOUN.decode(videoPermlink)
            console.log('Video loaded from URL', json)
        } catch (error) {
            console.log('Bad video JSON', error)
            return
        }
        handleVideo(json)
    }
    else
        findAvalon(videoAuthor, videoPermlink, function(err, res) {
            if (err || !res) {
                console.log(err, res)
                findVideo()
            } else {
                console.log('Video loaded from '+avalonAPI, res)
                handleVideo(res.json)
            }
        })
}

function findInShortTerm(prov, hash, cb) {
    var gw = getDefaultGateway(prov)
    const url = gw + hash
    const request = new XMLHttpRequest();
    request.open("HEAD", url, true);
    request.onerror = function(e) {
        console.log('Error: ' + url)
    }
    request.onreadystatechange = function() {
        if (request.readyState === request.DONE) {
            if (request.status === 200) {
                const headers = request.getAllResponseHeaders()
                console.log(headers, gw)
                cb(true)
            } else cb()
        }
    }
    request.send();
}

function findAvalon(author, link, cb) {
    // avalon
    fetch(avalonAPI+'/content/'+author+'/'+link, {
        method: 'get',
        headers: {
            'Accept': 'application/json, text/plain, */*',
            'Content-Type': 'application/json'
        }
    }).then(status).then(res => res.json()).then(function(res) {
        cb(null, res)
    }).catch(function(err) {
        cb(err)
    })
}

function findVideo(retries = 3) {
    if (videoPermlink == 'live') {
        document.addEventListener("DOMContentLoaded", function() {
            createLiveStream(autoplay, nobranding, null) 
        });
               
        return
    }
    var api = steemAPI[(3-retries)%steemAPI.length]
    var client = new LightRPC(api, {
        timeout: timeout
    })

    client.send('get_content', [videoAuthor, videoPermlink], {timeout: timeout}, function(err, b) {
        if (err) {
            console.log(retries, api, err)
            if (retries>0) {
                findVideo(--retries)
            } else {
                console.log('Stopped trying to load (tried too much)')
            }
            return
        }
        console.log('Video loaded from '+api, b)
        var a = JSON.parse(b.json_metadata).video;
        handleVideo(a)
    });
    timeout *= 2
}

function handleVideo(video) {
    if (!provider) provider = getDefaultProvider(video)
    
    switch (provider) {
        // Our custom DTube Player
        case "IPFS":
        case "BTFS":
            var gw = getDefaultGateway(provider, video)
            var qualities = generateQualities(video)
            findInShortTerm(provider, qualities[0].hash, function(isAvail) {
                addQualitiesSource(qualities, (isAvail ? gw : getFallbackGateway(provider)))
        
                var snapHash = getSnapHash(video)
                var spriteHash = getSpriteHash(video)
                var duration = getDuration(video)
                var subtitles = getSubtitles(video)
                createPlayer(snapHash, autoplay, nobranding, qualities, spriteHash, duration, subtitles)
            })
            break;

        case "Skynet":
            var gw = getDefaultGateway(provider, video)
            var qualities = generateQualities(video)
            addQualitiesSource(qualities, gw, 'Skynet')
            
            var snapHash = getSnapHash(video)
            var spriteHash = getSpriteHash(video)
            var duration = getDuration(video)
            var subtitles = getSubtitles(video)
            
            createPlayer(snapHash, autoplay, nobranding, qualities, spriteHash, duration, subtitles)
            break;

        // Redirects to 3rd party embeds
        case "Twitch":
            if (video.twitch_type && video.twitch_type == 'clip')
              window.location.href = "https://clips.twitch.tv/embed?clip=" + video.videoId
                + "&autoplay=true&muted=false"
            else
                if (parseInt(video.videoId) == video.videoId)
                    window.location.href =  "https://player.twitch.tv/?video=v" + video.videoId
                        + "&autoplay=true&muted=false"
                else
                    window.location.href = "https://player.twitch.tv/?channel=" + video.videoId
                        + "&autoplay=true&muted=false"
            break;

        case "Dailymotion":
            window.location.href = "https://www.dailymotion.com/embed/video/" + video.videoId
                + "?autoplay=true&mute=false"
            break;

        case "Instagram":
            window.location.href = "https://www.instagram.com/p/" + video.videoId + '/embed/'
            break;

        case "LiveLeak":
            window.location.href = "https://www.liveleak.com/e/" + video.videoId
            break;

        case "Vimeo":
            window.loaction.href = "https://player.vimeo.com/video/" + video.videoId
                + "?autoplay=1&muted=0"
            break;

        case "Facebook":
            window.location.href = "https://www.facebook.com/v2.3/plugins/video.php?allowfullscreen=true&autoplay=true&container_width=800&href="
                + encodeURI(video.url)
            break;

        case "YouTube":
            window.location.href = "https://www.youtube.com/embed/" + video.videoId
                + "?autoplay=1&showinfo=1&modestbranding=1"
            break;

        default:
            break;
    }
}

function getDefaultProvider(video) {
    if (video && video.providerName) return video.providerName
    if (video && video.files) {
        if (video.files.btfs)
            return 'BTFS'
        if (video.files.ipfs)
            return 'IPFS'
        if (video.files.sia)
            return 'Skynet'
        if (video.files.youtube)
            return 'YouTube'
        if (video.files.facebook)
            return 'Facebook'
        if (video.files.vimeo)
            return 'Vimeo'
        if (video.files.liveleak)
            return 'LiveLeak'
        if (video.files.instagram)
            return 'Instagram'
        if (video.files.dailymotion)
            return 'Dailymotion'
        if (video.files.twitch)
            return 'Twitch'
    }
    return 'IPFS'
}

function getDefaultGateway(prov, video) {
    if (prov == 'IPFS' && video && video.files && video.files.ipfs && video.files.ipfs.gw)
        return video.files.ipfs.gw
    if (prov == 'BTFS' && video && video.files && video.files.btfs && video.files.btfs.gw)
        return video.files.btfs.gw
    if (prov == 'IPFS') return portals.IPFS[0]
    if (prov == 'BTFS') return portals.BTFS[0]
    if (prov == 'Skynet') return portals.Skynet[0]
    return
}

function getFallbackGateway(prov) {
    if (prov == 'IPFS') return portals.IPFS[1]
    if (prov == 'BTFS') return portals.BTFS[1]
    if (prov == 'Skynet') return portals.Skynet[1]
}

function getSnapHash(video) {
    if (video.files && video.files.btfs && video.files.btfs.img && video.files.btfs.img["360"])
        return video.files.btfs.img["360"]
    if (video.files && video.files.ipfs && video.files.ipfs.img && video.files.ipfs.img["360"])
        return video.files.ipfs.img["360"]
    if (video.files && video.files.btfs && video.files.btfs.img && video.files.btfs.img["118"])
        return video.files.btfs.img["118"]
    if (video.files && video.files.ipfs && video.files.ipfs.img && video.files.ipfs.img["118"])
        return video.files.ipfs.img["118"]
    if (video.ipfs && video.ipfs.snaphash) return video.ipfs.snaphash
    if (video.info && video.info.snaphash) return video.info.snaphash
    return ''
}

function getSpriteHash(video) {
    if (video.files && video.files.btfs && video.files.btfs.img && video.files.btfs.img.spr)
        return video.files.btfs.img.spr
    if (video.files && video.files.ipfs && video.files.ipfs.img && video.files.ipfs.img.spr)
        return video.files.ipfs.img.spr
    if (video.ipfs && video.ipfs.spritehash) return video.ipfs.spritehash
    if (video.content && video.content.spritehash) return video.content.spritehash
    if (video.info && video.info.spritehash) return video.info.spritehash
    return ''
}

function getDuration(video) {
    if (video.dur) return video.dur
    if (video.duration) return video.duration
    if (video.info && video.info.duration) return video.info.duration
}

function getSubtitles(video) {
    if (video.ipfs && video.ipfs.subtitles) return video.ipfs.subtitles
    if (video.content && video.content.subtitles) return video.content.subtitles
    if (video.files && video.files.ipfs && video.files.ipfs.sub) {
        var subs = []
        for (const lang in video.files.ipfs.sub) {
            subs.push({
                lang: lang,
                hash: video.files.ipfs.sub[lang]
            })
        }
        return subs
    }
    return null
}

function enableSprite(duration, sprite) {
    if (!duration) return
    if (!sprite) return
    var listThumbnails = {}
    var nFrames = 100
    if (duration < 100) nFrames = Math.floor(duration)
    for (let s = 0; s < nFrames; s++) {
        var nSeconds = s
        if (duration > 100) nSeconds = Math.floor(s * duration / 100)
        listThumbnails[nSeconds] = {
            src: spriteUrl(sprite),
            style: {
                margin: -72 * s + 'px 0px 0px 0px',
            }
        }
    }
    player.thumbnails(listThumbnails);
}

function createPlayer(posterHash, autoplay, branding, qualities, sprite, duration, subtitles) {
    var c = document.createElement("video");
    c.poster = 'https://snap1.d.tube/ipfs/'+posterHash;
    c.controls = true;
    c.autoplay = autoplay;
    c.id = "player";
    c.className = "video-js";
    c.style = "width:100%;height:100%";
    c.addEventListener('loadeddata', function() {
        if (c.readyState >= 3) {
            itLoaded = true
            if (!duration) {
                duration = Math.round(player.duration())
                parent.postMessage({dur: duration}, "*")
                enableSprite(duration, sprite)
            }
        }
    });

    var video = document.body.appendChild(c);

    // Setting menu items
    var menuEntries = []
    menuEntries.push('PlaybackRateMenuButton')
    if (subtitles)
        menuEntries.push('SubtitlesButton')
    menuEntries.push('ResolutionMenuButton')
    menuEntries.push('GatewaySwitcherMenuButton')


    var defaultQuality = qualities[0].label
    if (hasQuality('480p', qualities))
        defaultQuality = '480p'
    var persistedQuality = getStorageItem('dquality');
    if(persistedQuality !== null && hasQuality(persistedQuality, qualities)){
      defaultQuality = persistedQuality
    }
    
    player = videojs("player", {
        inactivityTimeout: 1000,
        sourceOrder: true,
        sources: qualities,
        techOrder: ["html5"],
        'playbackRates': [0.5, 0.75, 1, 1.25, 1.5, 2],
        controlBar: {
            children: {
                'playToggle': {},
                'muteToggle': {},
                'volumeControl': {},
                'currentTimeDisplay': {},
                'timeDivider': {},
                'durationDisplay': {},
                'liveDisplay': {},
                'flexibleWidthSpacer': {},
                'progressControl': {},
                'settingsMenuButton': {
                    entries: menuEntries
                },
                'fullscreenToggle': {}
            }
        },
        plugins: {
            persistvolume: {
                namespace: 'dtube'
            },
            IPFSGatewaySwitcher: {},
            videoJsResolutionSwitcher: {
                default: defaultQuality,
                dynamicLabel: true
            },
            statistics: {

            }
        }
    })
    enableSprite(duration, sprite)
    videojs('player').ready(function() {
        const adapter = new playerjs.VideoJSAdapter(this)
        
        let loadedVidUrl = player.options_.sources[0].src
        let loadedGateway = loadedVidUrl.split('/')[2]
        document.getElementsByClassName('vjs-settings-sub-menu-value')[document.getElementsByClassName('vjs-settings-sub-menu-value').length - 1].innerHTML = loadedGateway
        
        this.hotkeys({
            seekStep: 5,
            enableModifiersForNumbers: false
        });

        window.onmessage = function(e) {
            if (e.data.seekTo)
                player.currentTime(e.data.seekTime)
        }

        if (subtitles) {
            for (let i = 0; i < subtitles.length; i++) {
                player.addRemoteTextTrack({
                    kind: "subtitles",
                    src: subtitleUrl(subtitles[i].hash),
                    srclang: subtitles[i].lang,
                    label: subtitles[i].lang
                })
    
            }
        }

        adapter.ready()
    });

    player.brand({
        branding: !JSON.parse(nobranding),
        title: "Watch on DTube",
        destination: "http://d.tube/#!/v/" + videoAuthor + '/' + videoPermlink,
        destinationTarget: "_blank"
    })

    handleResize()
}


function createLiveStream(autoplay, branding, content) {
    var c = document.createElement("video");
    c.controls = true;
    c.autoplay = autoplay;
    c.id = "player";
    c.className = "video-js";
    c.style = "width:100%;height:100%";
    c.addEventListener('loadeddata', function() {
        if (c.readyState >= 3) {
            itLoaded = true
        }
    });

    var video = document.body.appendChild(c);
    
    player = videojs("player", {
        inactivityTimeout: 1000,
        techOrder: ["html5"],
        controlBar: {
            children: {
                'playToggle': {},
                'muteToggle': {},
                'volumeControl': {},
                'currentTimeDisplay': {},
                'timeDivider': {},
                'durationDisplay': {},
                'liveDisplay': {},
                'flexibleWidthSpacer': {},
                'progressControl': {},
                'fullscreenToggle': {}
            }
        },
        plugins: {
            persistvolume: {
                namespace: 'dtube'
            },
            statistics: {

            }
        }
    })

    if (content) {
        var request = new XMLHttpRequest();
        var unix_timestamp = Date.parse(content.created+'Z')/1000
        request.open('GET', 'https://stream.dtube.top:3000/oldStream/'+content.author+'/'+unix_timestamp, true);
        request.onload = function() {
            if (request.status >= 200 && request.status < 400) {
                var data = JSON.parse(request.responseText)
                if (data[0][0])
                    var d0 = Math.abs(unix_timestamp - data[0][0].timeStart)
                if (data[1][0])
                    var d1 = Math.abs(unix_timestamp - data[1][0].timeStart)
                var dn = Math.abs(+new Date()/1000 - unix_timestamp)
                if (d1<d0 || !data[0][0]) {
                    d0 = d1
                    data[0][0] = data[1][0]
                }
                if (d0 && d0 < 5*60 && dn > 6*60*60) {
                    console.log('playing old stream video', d0)
                    videosrc = 'https://video.dtube.top/streams/'+data[0][0].filePath
                    player.src(videosrc)
                    return
                }
                var livesrc = 'https://stream.dtube.top:4433/hls/normal%2b'+videoAuthor+'/index.m3u8'
                player.src({
                    src: livesrc,
                    type: 'application/x-mpegURL'
                })
                player.on('error', function(event) {
                    console.log('playing old stream video', d0)
                    videosrc = 'https://video.dtube.top/streams/'+data[0][0].filePath
                    player.src(videosrc)
                })
                
            } else {
                console.log('Error stream API')
            }
        };
        
        request.onerror = function() {
            console.log('Error stream API')
        };
        
        request.send();
    } else {
        var livesrc = 'https://stream.dtube.top:4433/hls/normal%2b'+videoAuthor+'/index.m3u8'
        player.src({
            src: livesrc,
            type: 'application/x-mpegURL'
        })
    }

    videojs('player').ready(function() {
        this.hotkeys({
            seekStep: 5,
            enableModifiersForNumbers: false
        });
    });

    player.brand({
        branding: !JSON.parse(nobranding),
        title: "Watch on DTube",
        destination: "http://d.tube/#!/v/" + videoAuthor + '/' + videoPermlink,
        destinationTarget: "_blank"
    })
}

function removePlayer() {
    var elem = document.getElementById('player');
    return elem.parentNode.removeChild(elem);
}

function subtitleUrl(ipfsHash) {
    return 'https://snap1.d.tube/ipfs/' + ipfsHash
}

function spriteUrl(ipfsHash) {
    return 'https://sprite.d.tube/btfs/' + ipfsHash
}

function generateQualities(a) {
    var qualities = []
    // new format
    if (a.files) {
        for (const prov in a.files) {
            if (!a.files[prov].vid) continue;
            for (const key in a.files[prov].vid) {
                if (key == 'src') {
                    qualities.push({
                        label: 'Source',
                        type: 'video/mp4',
                        hash: a.files[prov].vid.src,
                        network: prov.toUpperCase()
                    })
                    continue
                }
                qualities.push({
                    label: key+'p',
                    type: 'video/mp4',
                    hash: a.files[prov].vid[key],
                    network: prov.toUpperCase()
                })
            }
        }
        return qualities
    }

    // old video format
    if (a.ipfs) {
        if (a.ipfs.video240hash) {
            qualities.push({
                label: '240p',
                type: 'video/mp4',
                hash: a.ipfs.video240hash,
            })
        }
        if (a.ipfs.video480hash) {
            qualities.push({
                label: '480p',
                type: 'video/mp4',
                hash: a.ipfs.video480hash,
            })
        }
        if (a.ipfs.video720hash) {
            qualities.push({
                label: '720p',
                type: 'video/mp4',
                hash: a.ipfs.video720hash,
            })
        }
        if (a.ipfs.video1080hash) {
            qualities.push({
                label: '1080p',
                type: 'video/mp4',
                hash: a.ipfs.video1080hash,
            })
        }
        if (a.ipfs.videohash) {
            qualities.push({
                label: 'Source',
                type: 'video/mp4',
                hash: a.ipfs.videohash,
            })
        }
    } else {
        if (a.content && a.content.video240hash) {
            qualities.push({
                label: '240p',
                type: 'video/mp4',
                hash: a.content.video240hash,
            })
        }
        if (a.content && a.content.video480hash) {
            qualities.push({
                label: '480p',
                type: 'video/mp4',
                hash: a.content.video480hash,
            })
        }
        if (a.content && a.content.video720hash) {
            qualities.push({
                label: '720p',
                type: 'video/mp4',
                hash: a.content.video720hash,
            })
        }
        if (a.content && a.content.video1080hash) {
            qualities.push({
                label: '1080p',
                type: 'video/mp4',
                hash: a.content.video1080hash,
            })
        }
        if (a.content && a.content.videohash) {
            qualities.push({
                label: 'Source',
                type: 'video/mp4',
                hash: a.content.videohash,
            })
        }
    }
    return qualities
}

function addQualitiesSource(qualities, gateway, prov) {
    if (prov == 'Skynet') {
        for (let i = 0; i < qualities.length; i++) {
            qualities[i].src = gateway + qualities[i].hash
        }
        return
    }
    for (let i = 0; i < qualities.length; i++) {
        qualities[i].src = gateway + qualities[i].hash
    }
}

function hasQuality(label, qualities) {
    for (let i = 0; i < qualities.length; i++) 
        if (qualities[i].label == label) return true
    return false
}

window.onresize = handleResize;
function handleResize() {
    if (!window) return
    if (window.innerWidth >= 360) {
        document.getElementsByClassName('vjs-time-control')[0].style.display = "block"
        document.getElementsByClassName('vjs-time-control')[1].style.display = "block"
        document.getElementsByClassName('vjs-time-control')[2].style.display = "block"
    } else {
        document.getElementsByClassName('vjs-time-control')[0].style.display = "none"
        document.getElementsByClassName('vjs-time-control')[1].style.display = "none"
        document.getElementsByClassName('vjs-time-control')[2].style.display = "none"
    }
}