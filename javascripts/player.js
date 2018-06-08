gateways = [
    "https://ipfs.io"
]
player = null
itLoaded = false
timeout = 1000
var client = new LightRPC('https://api.steemit.com', {
    timeout: timeout
})
var path = window.location.href.split("#!/")[1];
var autoplay = (path.split("/")[2] == 'true')
var nobranding = (path.split("/")[3] == 'true')
var videoGateway = path.split("/")[4]
var snapGateway = path.split("/")[5]

findVideo()


function findVideo(retries = 3) {
    client.send('get_content', [path.split("/")[0], path.split("/")[1]], {timeout: timeout}, function(err, b) {
        if (err) {
            if (err.message.toString().startsWith('Request has timed out.')) {
                console.log(err, retries)
                if (retries>0) {
                    findVideo(--retries)
                } else {
                    console.log('Stopped trying to load')
                }
            }
            else
                console.log(err)
            return
        }
        var a = JSON.parse(b.json_metadata).video;
    
        var qualities = generateQualities(a, videoGateway)
        createPlayer(canonicalUrl(a.info.snaphash), autoplay, nobranding, qualities, a.info.spritehash, a.info.duration, a.content.subtitles)
    
        // trying to find something that answers faster than the canonical gateway
        if (!videoGateway)
            findBestUrl(qualities[0].hash, function(url) {
                console.log(url)
                for (let i = 0; i < qualities.length; i++) {
                    if (qualities[i].label !== qualities[0].label) break
                    qualities[i].src = url
                }
                player.updateSrc(qualities)
            })
    
    });
    timeout *= 2
}

function createPlayer(posterUrl, autoplay, branding, qualities, sprite, duration, subtitles) {
    var c = document.createElement("video");
    c.poster = posterUrl;
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

    var menuEntries = []
    menuEntries.push('PlaybackRateMenuButton')
    if (subtitles)
        menuEntries.push('SubtitlesButton')
    menuEntries.push('ResolutionMenuButton')


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
            videoJsResolutionSwitcher: {
                default: defaultQuality
            },
            statistics: {

            }
        }
    })

    if (sprite) {
        var listThumbnails = {}
        var nFrames = 100
        if (duration < 100) nFrames = Math.floor(duration)
        for (let s = 0; s < nFrames; s++) {
            var nSeconds = s
            if (duration > 100) nSeconds = Math.floor(s * duration / 100)
            listThumbnails[nSeconds] = {
                src: canonicalUrl(sprite),
                style: {
                    margin: -118 * s + 'px 0px 0px 0px',
                }
            }
        }
        player.thumbnails(listThumbnails);
    }


    videojs('player').ready(function() {
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
                    src: canonicalUrl(subtitles[i].hash),
                    srclang: subtitles[i].lang,
                    label: subtitles[i].lang
                })
    
            }
        }
    });

    player.brand({
        branding: !JSON.parse(nobranding),
        title: "Watch on DTube",
        destination: "http://d.tube/#!/v/" + path.split("/")[0] + '/' + path.split("/")[1],
        destinationTarget: "_blank"
    })
}

function removePlayer() {
    var elem = document.getElementById('player');
    return elem.parentNode.removeChild(elem);
}

function canonicalGateway(ipfsHash) {
    var g = ipfsHash.charCodeAt(ipfsHash.length - 1) % gateways.length
    return gateways[g].split('://')[1]
}

function canonicalUrl(ipfsHash) {
    return 'https://' + canonicalGateway(ipfsHash) + '/ipfs/' + ipfsHash
}

function findBestUrl(hash, cb) {
    let isFirst = true;
    gateways.forEach((gateway) => {
        const url = gateway + '/ipfs/' + hash
        const timeStart = new Date()
        const request = new XMLHttpRequest();
        request.open("HEAD", url, true);
        request.onerror = function(e) {
            console.log('Error: ' + url)
        }
        request.onreadystatechange = function() {
            if (request.readyState === request.HEADERS_RECEIVED) {
                if (request.status === 200) {
                    const headers = request.getAllResponseHeaders()
                    if (headers.toLowerCase().includes("content-type: video") && isFirst) {
                        isFirst = false
                        cb(url)
                    }
                }
            }
        }
        request.send();
    })
}

function generateQualities(a, videoGateway) {
    var qualities = []
    // sorted from lowest to highest quality
    if (a.content.video240hash) {
        qualities.push({
            label: '240p',
            type: 'video/mp4',
            hash: a.content.video240hash,
            src: videoGateway ? videoGateway + '/ipfs/' + a.content.video240hash : canonicalUrl(a.content.video240hash)
        })
    }
    if (a.content.video480hash) {
        qualities.push({
            label: '480p',
            type: 'video/mp4',
            hash: a.content.video480hash,
            src: videoGateway ? videoGateway + '/ipfs/' + a.content.video480hash : canonicalUrl(a.content.video480hash)
        })
    }
    if (a.content.video720hash) {
        qualities.push({
            label: '720p',
            type: 'video/mp4',
            hash: a.content.video720hash,
            src: videoGateway ? videoGateway + '/ipfs/' + a.content.video720hash : canonicalUrl(a.content.video720hash)
        })
    }
    if (a.content.video1080hash) {
        qualities.push({
            label: '1080p',
            type: 'video/mp4',
            hash: a.content.video1080hash,
            src: videoGateway ? videoGateway + '/ipfs/' + a.content.video1080hash : canonicalUrl(a.content.video1080hash)
        })
    }
    qualities.push({
        label: 'Source',
        type: 'video/mp4',
        hash: a.content.videohash,
        src: videoGateway ? videoGateway + '/ipfs/' + a.content.videohash : canonicalUrl(a.content.videohash)
    })
    return qualities
}

function hasQuality(label, qualities) {
    for (let i = 0; i < qualities.length; i++) 
        if (qualities[i].label == label) return true
    return false
}
