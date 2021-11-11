import { getStream } from './media'

// Init phase 03
export default async () => {
    // Get user media
    const stream = await getStream()

    document.body.classList.remove('phase-02-active')
    document.body.classList.add('phase-04-active')

    // Set tracking class
    document.body.classList.add('tracking')

    // Show video feed
    var video = document.querySelector('video.face-readout')
    video.srcObject = stream
    video.onloadedmetadata = () => {
        video.play()
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
        requestAnimationFrame(draw)

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

    setInterval(() => {}, 500)
}
