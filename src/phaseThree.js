import { getStream } from './media'

let videoLoaded = false

const markWhiteList = [0, 1, 3]
const drawFaceLandmarks = (predictions) => {
    const dots = [...document.querySelectorAll('svg.landmarks circle')]
    const marks = predictions[0]?.landmarks || []
    const tl = predictions[0]?.topLeft || [0, 0]

    for (let i in marks) {
        if (!markWhiteList.includes(parseInt(i))) continue
        const mark = marks[i]
        dots[i].setAttribute('transform', `translate(${mark[0]}, ${mark[1]})`)
        // dots[i].setAttribute('cx', mark[0])
        // dots[i].setAttribute('cy', mark[1])

        // console.log(dots[i], mark)
    }
}

// Init phase 03
export default async () => {
    // Get user media
    const stream = await getStream()

    document.body.classList.remove('phase-02-active')
    document.body.classList.add('phase-04-active')

    // Set tracking class
    document.body.classList.add('tracking')

    // Set viewbox to stream dims
    const streamW = stream.getVideoTracks()[0].getSettings().width
    const streamH = stream.getVideoTracks()[0].getSettings().height
    const landmarkSVG = document.querySelector('svg.landmarks')
    landmarkSVG.setAttribute('viewBox', `0 0 ${streamW} ${streamH}`)

    // Show video feed
    var video = document.querySelector('video.face-readout')
    video.srcObject = stream
    video.onloadedmetadata = async () => {
        video.play()
        await new Promise((res) => setTimeout(res, 100))
        videoLoaded = true
    }

    // Waveform visualizer
    const audioCtx = new (window.AudioContext || window.webkitAudioContext)()
    const analyser = audioCtx.createAnalyser()
    const source = audioCtx.createMediaStreamSource(stream)
    source.connect(analyser)

    analyser.fftSize = 512
    const bufferLength = analyser.frequencyBinCount
    const dataArray = new Uint8Array(bufferLength)

    const waveCanvas = document.querySelector('.wave')
    const canvasCtx = waveCanvas.getContext('2d')
    const HEIGHT = waveCanvas.height
    const WIDTH = waveCanvas.width

    function draw() {
        if (document.body.classList.contains('tracking')) {
            requestAnimationFrame(draw)
        }

        analyser.getByteFrequencyData(dataArray)

        canvasCtx.fillStyle = 'rgb(0, 0, 0)'
        canvasCtx.fillRect(0, 0, WIDTH, HEIGHT)

        var barWidth = (WIDTH / bufferLength) * 2.5
        var barHeight
        var x = 0

        for (var i = 0; i < bufferLength; i++) {
            barHeight = (dataArray[i] / 200) * (HEIGHT * 0.75)

            canvasCtx.fillStyle = '#F4FF00'
            canvasCtx.fillRect(x, HEIGHT / 2 - barHeight / 2, 2, barHeight)

            x += barWidth + 1
        }
    }
    draw()

    // canvasCtx.clearRect(0, 0, WIDTH, HEIGHT);
    const model = await blazeface.load()

    // Face detection loop
    setInterval(async () => {
        if (videoLoaded) {
            const predictions = await model.estimateFaces(video)
            drawFaceLandmarks(predictions)
        }
    }, 100)
}
