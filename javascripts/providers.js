var allProviders = [
    {id: 'btfs', disp: 'BTFS', dht: 1},
    {id: 'ipfs', disp: 'IPFS', dht: 1},
    {id: 'sia', disp: 'Skynet', dht: 1},
    {id: 'youtube', disp: 'YouTube'},
    {id: 'twitch', disp: 'Twitch'},
    {id: 'dailymotion', disp: 'Dailymotion'},
    {id: 'instagram', disp: 'Instagram'},
    {id: 'liveleak', disp: 'LiveLeak'},
    {id: 'vimeo', disp: 'Vimeo'},
    {id: 'facebook', disp: 'Facebook'},
]
var failedProviders = []
provider = null
prov = {
    idToDisp: function(id) {
        for (let i = 0; i < allProviders.length; i++)
            if (allProviders[i].id == id)
                return allProviders[i].disp
        return
    },
    dispToId: function(disp) {
        for (let i = 0; i < allProviders.length; i++)
        if (allProviders[i].disp == disp)
            return allProviders[i].id
    return
    },
    tryNext: function(video) {
        failedProviders.push(provider)
        var available = this.available(video)
        var reallyAvailable = []
        for (let i = 0; i < available.length; i++) {
            if (failedProviders.indexOf(available[i]) == -1)
                reallyAvailable.push(available[i])
        }
        if (reallyAvailable.length > 0) {
            provider = reallyAvailable[0]
            handleVideo(video)
        }
    },
    getDefaultGateway: function(video) {
        if (provider == 'IPFS' && video && video.files && video.files.ipfs && video.files.ipfs.gw)
            return video.files.ipfs.gw
        if (provider == 'BTFS' && video && video.files && video.files.btfs && video.files.btfs.gw)
            return video.files.btfs.gw
        if (provider == 'IPFS') return portals.IPFS[0]
        if (provider == 'BTFS') return portals.BTFS[0]
        if (provider == 'Skynet') return portals.Skynet[0]
        return
    },
    getFallbackGateway: function() {
        if (provider == 'IPFS') return portals.IPFS[1]
        if (provider == 'BTFS') return portals.BTFS[1]
        if (provider == 'Skynet') return portals.Skynet[1]
    },
    available: function(video) {
        var provs = []
        if (video && video.files) {
            if (video.files.btfs)
                provs.push('BTFS')
            if (video.files.ipfs)
                provs.push('IPFS')
            if (video.files.sia)
                provs.push('Skynet')
            if (video.files.youtube)
                provs.push('YouTube')
            if (video.files.facebook)
                provs.push('Facebook')
            if (video.files.vimeo)
                provs.push('Vimeo')
            if (video.files.liveleak)
                provs.push('LiveLeak')
            if (video.files.instagram)
                provs.push('Instagram')
            if (video.files.dailymotion)
                provs.push('Dailymotion')
            if (video.files.twitch)
                provs.push('Twitch')
        }
        if (video && video.providerName && provs.indexOf(video.providerName) == -1) 
            provs.push(video.providerName)
        return provs
    },
    default: function(video) {
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
}