function getCurrentStats() {
    return {
        droppedVideoFrames: player.getVideoPlaybackQuality().droppedVideoFrames,
        totalVideoFrames: player.getVideoPlaybackQuality().totalVideoFrames,
        paused: player.paused(),
        volume: player.volume(),
        resolution: player.videoWidth() + 'x' + player.videoHeight(),
        viewport: window.innerWidth + 'x' + window.innerHeight,
        gateway: player.currentSource().src.split('/')[2],
        fileSrc: player.currentSource().src,
        fileType: player.currentSource().type,
        buffered: player.bufferedEnd() - player.currentTime(),
    }
}

function statisticsPlugin(options) {
    var isStarted = false
    var interval = null
    this.on('stopStats', function() {
        clearInterval(interval)
    })
    this.on('startStats', function() {
        if (!isStarted) {
            isStarted = true
            player.currentStats = getCurrentStats()
            player.statsBuffered = [player.currentStats.buffered]
            interval = setInterval(function() {
                player.currentStats = getCurrentStats()
                player.statsBuffered.push(player.currentStats.buffered)
                if (player.statsBuffered.length > 60 * 4)
                    player.statsBuffered.splice(0, 1)
                var element = document.getElementById("infoPanel");
                if (element)
                    element.parentNode.removeChild(element);
                var infoPanel = document.createElement("div")
                infoPanel.className += 'video-js-info-panel'
                infoPanel.id = 'infoPanel'
                for (var metric in player.currentStats) {
                    var div = document.createElement("div")
                    if (metric == 'buffered') {
                        var textnode = document.createTextNode(metric + ': ')
                        div.appendChild(textnode)
                        var canvas = document.createElement('canvas');
                        canvas.height = 20
                        new Graph(player.statsBuffered, canvas, {
                            background: "rgba(0,0,0,0)",
                            lineWidth: 2,
                            lineColor: "#F00"
                        });
                        div.appendChild(canvas)
                        var textnode = document.createTextNode(player.currentStats[metric])
                        div.appendChild(textnode)
                    } else {
                        var textnode = document.createTextNode(metric + ': ' + player.currentStats[metric])
                        div.appendChild(textnode)
                    }

                    infoPanel.appendChild(div)
                }
                document.body.appendChild(infoPanel)
            }, 250)

        }

    })
}

videojs.registerPlugin('statistics', statisticsPlugin);