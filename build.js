var fs = require('fs')
var terser = require("terser")
var ccss = require('clean-css')

var binPath = './bin/'
var css = []
var js = []
css.push("./videojs.css")
css.push("./player.css")
js.push("./lib/lightrpc.min.js")
js.push("./lib/swiftclick.min.js")
js.push("./lib/playerjs.min.js")
js.push("./javascripts/video.js")
js.push("./lib/videojs-contrib-hls.min.js")
js.push("./javascripts/jsoun.js")
js.push("./javascripts/localstorage.js")
js.push("./javascripts/branding.js")
js.push("./javascripts/persistvolume.js")
js.push("./javascripts/resolutionswitcher.js")
js.push("./javascripts/ipfsgatewayswitcher.js")
js.push("./javascripts/settingsmenubuttons.js")
js.push("./javascripts/settingsmenuitem.js")
js.push("./javascripts/hotkeys.js")
js.push("./javascripts/thumbnails.js")
js.push("./javascripts/providers.js")
js.push("./javascripts/player.js")
js.push("./javascripts/statistics.js")
js.push("./javascripts/graph.js")
js.push("./javascripts/snap.js")

var cssBundle = ""
for (let i = 0; i < css.length; i++) {
    console.log('minifying '+css[i])
    var code = fs.readFileSync(css[i],'utf8')
    var clean = new ccss({}).minify(code)
    for (let y = 0; y < clean.errors.length; y++)
        console.log('css error:', css[i], clean.errors[y])
    for (let y = 0; y < clean.warnings.length; y++)
        console.log('css warn:', css[i], clean.warnings[y])
    
    cssBundle += clean.styles+'\n'
}
fs.writeFileSync(binPath+'dtube.css', cssBundle)
console.log('CSS minified in '+binPath+'dtube.css')

var jsBundle = ""
for (let i = 0; i < js.length; i++) {
    console.log('minifying '+js[i])
    var code = fs.readFileSync(js[i],'utf8')
    var ugly = terser.minify(code)
    if (ugly.error)
        throw new Error(ugly.error)
    jsBundle += ugly.code+'\n'
}
fs.writeFileSync(binPath+'dtube.min.js', jsBundle)
console.log('JS minified in '+binPath+'dtube.min.js')


