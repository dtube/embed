function takeSnap() {
    var video = document.querySelector('video')
    var canvas = document.querySelector('canvas')
    var context = canvas.getContext('2d')
    var w, h, ratio
    
    // Calculate the ratio of the video's width to height
    ratio = video.videoWidth / video.videoHeight
    // Define the required width as 100 pixels smaller than the actual video's width
    w = video.videoWidth - 100
    // Calculate the height based on the video's width and the ratio
    h = parseInt(w / ratio, 10)
    // Set the canvas width and height to the values just calculated
    canvas.width = w
    canvas.height = h
    
    // Define the size of the rectangle that will be filled (basically the entire element)
    context.fillRect(0, 0, w, h)
    // Grab the image from the video
    context.drawImage(video, 0, 0, w, h)
    // Save snap to disk
    var dt = canvas.toDataURL('image/jpeg')
    $('#snap').attr('href', dt)
}