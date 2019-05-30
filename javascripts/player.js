gateways = [
    "https://ipfs.io",
    "https://video.dtube.network/"
]
steemAPI = [
    "https://api.steemit.com/",
    "https://steemd.minnowsupportproject.org/",
    "https://anyx.io/",
]
avalonAPI = 'https://bran.nannal.com'
shortTermGw = "https://video.dtube.top"
player = null
itLoaded = false
timeout = 1500
var path = window.location.href.split("#!/")[1];
var videoAuthor = path.split("/")[0]
var videoPermlink = path.split("/")[1]
var autoplay = (path.split("/")[2] == 'true')
var nobranding = (path.split("/")[3] == 'true')
var videoGateway = path.split("/")[4]
var snapGateway = path.split("/")[5]

if (videoAuthor != 'raza3223')
    findAvalon(videoAuthor, videoPermlink, function(err, res) {
        if (err || !res) {
            console.log(err, res)
            findVideo()
        } else {
            console.log('Video loaded from '+avalonAPI, res)
            handleVideo(res.json)
        }
    })
    


function findInShortTerm(hash, cb) {
    const url = shortTermGw + '/ipfs/' + hash
    const request = new XMLHttpRequest();
    request.open("HEAD", url, true);
    request.onerror = function(e) {
        console.log('Error: ' + url)
    }
    request.onreadystatechange = function() {
        if (request.readyState === request.HEADERS_RECEIVED) {
            if (request.status === 200) {
                const headers = request.getAllResponseHeaders()
                console.log(headers, shortTermGw)
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
    var provider = 'IPFS'
    if (video && video.providerName) provider = video.providerName

    switch (provider) {
        case "IPFS":
            var qualities = generateQualities(video)
            findInShortTerm(qualities[0].hash, function(isAvail) {
                addQualitiesSource(qualities, (isAvail ? shortTermGw : gateways[0]))
        
                // start the IPFS player
                var snapHash = ''
                if (video.info && video.info.snaphash) snapHash = video.info.snaphash
                if (video.ipfs && video.ipfs.snaphash) snapHash = video.ipfs.snaphash

                var spriteHash = ''
                if (video.info && video.info.spriteHash) spriteHash = video.info.spriteHash
                if (video.content && video.content.spriteHash) spriteHash = video.content.spriteHash
                if (video.ipfs && video.ipfs.spriteHash) spriteHash = video.ipfs.spriteHash

                var duration = 0
                if (video.info && video.info.duration) duration = video.info.duration
                if (video.duration) duration = video.duration

                var subtitles = null
                if (video.content && video.content.subtitles) subtitles = video.content.subtitles
                if (video.ipfs && video.ipfs.subtitles) subtitles = video.ipfs.subtitles

                createPlayer(snapHash, autoplay, nobranding, qualities, spriteHash, duration, subtitles)
            })
            break;

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
        destination: "http://d.tube/#!/v/" + videoAuthor + '/' + videoPermlink,
        destinationTarget: "_blank"
    })
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

function canonicalGateway(ipfsHash) {
    var g = ipfsHash.charCodeAt(ipfsHash.length - 1) % gateways.length
    return gateways[g].split('://')[1]
}

function canonicalUrl(ipfsHash) {
    return 'https://' + canonicalGateway(ipfsHash) + '/ipfs/' + ipfsHash
}

// function findBestUrl(hash, cb) {
//     let isFirst = true;
//     gateways.forEach((gateway) => {
//         const url = gateway + '/ipfs/' + hash
//         const request = new XMLHttpRequest();
//         request.open("HEAD", url, true);
//         request.onerror = function(e) {
//             console.log('Error: ' + url)
//         }
//         request.onreadystatechange = function() {
//             if (request.readyState === request.HEADERS_RECEIVED) {
//                 if (request.status === 200) {
//                     const headers = request.getAllResponseHeaders()
//                     console.log(headers, gateway)
//                     if (isFirst) {
//                         isFirst = false
//                         cb(gateway)
//                     }
//                 }
//             }
//         }
//         request.send();
//     })
// }

function generateQualities(a) {
    var qualities = []
    // sorted from lowest to highest quality
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

function addQualitiesSource(qualities, gateway) {
    for (let i = 0; i < qualities.length; i++) {
        qualities[i].src = gateway + '/ipfs/' + qualities[i].hash
    }
}

function hasQuality(label, qualities) {
    for (let i = 0; i < qualities.length; i++) 
        if (qualities[i].label == label) return true
    return false
}
