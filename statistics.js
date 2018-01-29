

function getCurrentStats() {
    return {
        buffered: player.bufferedEnd() - player.currentTime(),
        droppedVideoFrames: player.getVideoPlaybackQuality().droppedVideoFrames,
        totalVideoFrames: player.getVideoPlaybackQuality().totalVideoFrames,
        paused: player.paused(),
        volume: player.volume(),
        resolution: player.videoWidth()+'x'+player.videoHeight(),
        viewport: window.innerWidth+'x'+window.innerHeight,
        quality: player.currentResolution().label,
        hash: player.currentResolution().sources[0].hash,
        gateway: player.currentSource().src.split('/')[2],
        fileSrc: player.currentSource().src,
        fileType: player.currentSource().type,
    }
}

function statisticsPlugin(options) {
    var isStarted = false

    this.on('startStats', function() {
        if (!isStarted) {
            isStarted = true
            player.currentStats = getCurrentStats()
            setInterval(function() {
                player.currentStats = getCurrentStats()
                var element = document.getElementById("infoPanel");
                if (element)
                    element.parentNode.removeChild(element);
                var infoPanel = document.createElement("div")
                infoPanel.className += 'video-js-info-panel'
                infoPanel.id = 'infoPanel'
                for(var metric in player.currentStats) {
                    var div = document.createElement("div")
                    var textnode = document.createTextNode(metric+': '+player.currentStats[metric])
                    div.appendChild(textnode)
                    infoPanel.appendChild(div)
                }
                document.body.appendChild(infoPanel)
            }, 500)
            
        }
        
    })
}

videojs.registerPlugin('statistics', statisticsPlugin);