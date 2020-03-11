const links = [
    ["'", '"'],
    ['(', '{'],
    [')', '}'],
    ['_', ' '],
    ['~', '['],
    [';', ']'],
    ['!', '/'],
]

function randomChar(str) {
    var poss = '🧙‍♂️🕵🤡🤴🏻🐧'
    var char = poss[Math.floor(Math.random()*poss.length)]
    while (str.indexOf(char) != -1)
        char += poss[Math.floor(Math.random()*poss.length)]
    return char
}

function createRegex(char) {
    var str = char
    if (['(',')', '[',']'].indexOf(char) > -1)
        str = '\\'+str
    return new RegExp(str, 'g')
}

function swap(json) {
    for (let i = 0; i < links.length; i++) {
        let r0 = createRegex(links[i][0])
        let r1 = createRegex(links[i][1])
        var tmpChar = randomChar(json)
        let rt = createRegex(tmpChar)
        json = json.replace(r1, tmpChar)
        json = json.replace(r0, links[i][1])
        json = json.replace(rt, links[i][0])
    }
    return json
}

JSOUN = {
    encode: function(obj) {
        return encodeURI(swap(JSON.stringify(obj)))
    },
    decode: function(obj) {
        return JSON.parse(swap(decodeURI(obj)))
    }
}