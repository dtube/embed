gateways = [
    "ipfs.io"
]
shortTermGatewayHost = "video.dtube.top"
player = null
itLoaded = false
timeout = 1000
var client = new LightRPC('https://api.steemit.com', {
    timeout: timeout
})
var path = window.location.href.split("#!/")[1];
var videoAuthor = path.split("/")[0]
var videoPermlink = path.split("/")[1]
var autoplay = (path.split("/")[2] == 'true')
var nobranding = (path.split("/")[3] == 'true')
var videoGateway = path.split("/")[4]
var snapGateway = path.split("/")[5]

findVideo()


function findInShortTerm(quality) {
    return new Promise(function(resolve, reject) {
        const url = generateGatewayUrl(shortTermGatewayHost, quality.hash)
        const request = new XMLHttpRequest();

        // Assume not available if it's timing out
        request.timeout = 5000;
        request.ontimeout = function (e) {
            reject(quality)
        };

        request.open("HEAD", url, true);
        request.onerror = function(e) {
            console.log('Error: ' + url)
            reject(quality)
        }
        request.onreadystatechange = function() {
            if (request.readyState === request.HEADERS_RECEIVED) {
                if (request.status === 200) {
                    const headers = request.getAllResponseHeaders()
                    console.log(headers, shortTermGatewayHost)
                    resolve(quality)
                } else {
                    reject(quality)
                }
            }
        }
        request.send();
    })
}

function findVideo(retries = 3) {
    if (videoPermlink == 'live') {
        document.addEventListener("DOMContentLoaded", function() {
            createLiveStream(autoplay, nobranding, null)
        });

        return
    }

    client.send('get_content', [videoAuthor, videoPermlink], {timeout: timeout}, function(err, b) {
        if (err) {
            if (err.message.toString().startsWith('Request has timed out.')) {
                console.log(err, retries)
                if (retries>0) {
                    findVideo(--retries)
                } else {
                    console.log('Stopped trying to load')
                }
            }
            else console.log(err)

            return
        }
        var a = JSON.parse(b.json_metadata).video;
        if (a.info.livestream) {
            createLiveStream(autoplay, nobranding, b)
        } else {
            var qualities = generateQualities(a)

            checkQualityAvailabilityInShortTerm(qualities)
                .then(function(qualities) {
                    addQualitiesSource(qualities, shortTermGatewayHost)

                    // start the player
                    createPlayer(a.info.snaphash, autoplay, nobranding, qualities, a.info.spritehash, a.info.duration, a.content.subtitles)
                })
                .catch(function(e) {
                    console.error(e.message);
                })
        }
    });
    timeout *= 2
}

/**
 * Waiting for all promises to complete with a resolve or reject
 * @param arr
 * @returns {*}
 */
function settlePromises(arr){
    return Promise.all(arr.map(promise => {
        return promise.then(
            value => ({state: 'resolved', value}),
            value => ({state: 'rejected', value})
        );
    }));
}

/**
 * Checks if the file for each quality is available in short term gateway and mark the status
 * @param qualities
 * @returns {Promise}
 */
function checkQualityAvailabilityInShortTerm(qualities) {
    return new Promise(function(resolve, reject) {
        var checkPromises = [];

        try {
            for (var qi = 0; qi < qualities.length; qi++) {
                var quality = qualities[qi]
                checkPromises.push(findInShortTerm(quality))
            }
        } catch(e) {
            reject(e)
        }

        settlePromises(checkPromises).then(function(results) {
            var qualities = []

            for (let ri=0; ri<results.length; ri++) {
                var result = results[ri];
                var quality = result.value

                if (result.state === 'resolved') {
                    quality.availOnShortTerm = true
                } else {
                    quality.availOnShortTerm = false
                }

                qualities.push(quality)
            }

            resolve(qualities);
        })
    })
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
    return gateways[g]
}

function canonicalUrl(ipfsHash) {
    return generateGatewayUrl(canonicalGateway(ipfsHash), ipfsHash)
}

function generateGatewayUrl(hostname, ipfsHash) {
    return '//' + hostname + '/ipfs/' + ipfsHash
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
    if (a.content.video240hash) {
        qualities.push({
            label: '240p',
            type: 'video/mp4',
            hash: a.content.video240hash,
        })
    }
    if (a.content.video480hash) {
        qualities.push({
            label: '480p',
            type: 'video/mp4',
            hash: a.content.video480hash,
        })
    }
    if (a.content.video720hash) {
        qualities.push({
            label: '720p',
            type: 'video/mp4',
            hash: a.content.video720hash,
        })
    }
    if (a.content.video1080hash) {
        qualities.push({
            label: '1080p',
            type: 'video/mp4',
            hash: a.content.video1080hash,
        })
    }
    qualities.push({
        label: 'Source',
        type: 'video/mp4',
        hash: a.content.videohash,
    })
    return qualities
}

function addQualitiesSource(qualities, shortTermGatewayHost) {
    for (let qi = 0; qi < qualities.length; qi++) {
        var quality = qualities[qi]
        var gatewayUrl = generateGatewayUrl(shortTermGatewayHost, quality.hash)
        var fallbackGatewayUrl = canonicalUrl(quality.hash)

        quality.src = quality.availOnShortTerm ? gatewayUrl : fallbackGatewayUrl
    }
}

function hasQuality(label, qualities) {
    for (let i = 0; i < qualities.length; i++)
        if (qualities[i].label == label) return true
    return false
}
