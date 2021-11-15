import _shuffle from 'lodash/shuffle'
import { getStream } from './media'
import { Buffer } from 'buffer'
import phrases from './phrases'
import io from './io'

let videoLoaded = false
let shuffledPhrases = _shuffle(phrases)

/**
 * Accepts a Float32Array of audio data and converts it to a Buffer of l16 audio data (raw wav)
 *
 * Explanation for the math: The raw values captured from the Web Audio API are
 * in 32-bit Floating Point, between -1 and 1 (per the specification).
 * The values for 16-bit PCM range between -32768 and +32767 (16-bit signed integer).
 * Filter & combine samples to reduce frequency, then multiply to by 0x7FFF (32767) to convert.
 * Store in little endian.
 *
 * @param {Float32Array} input
 * @return {Buffer}
 */
const floatTo16BitPCM = function (input) {
    var output = new DataView(new ArrayBuffer(input.length * 2)) // length is in bytes (8-bit), so *2 to get 16-bit length
    for (var i = 0; i < input.length; i++) {
        var multiplier = input[i] < 0 ? 0x8000 : 0x7fff // 16-bit signed range is -32768 to 32767
        output.setInt16(i * 2, (input[i] * multiplier) | 0, true) // index, value, little edian
    }
    return Buffer.from(output.buffer)
}

// Pull next phrase from shuffled array and set
const setNextPhrase = () => {
    const nextPhrase = shuffledPhrases.pop()

    // Clear out all phrases
    const phraseArea = document.querySelector('.phrase h1')
    while (phraseArea.firstChild) {
        phraseArea.removeChild(phraseArea.firstChild)
    }

    const spans = nextPhrase.split(' ').filter(Boolean)
    for (let i in spans) {
        const spanWord = spans[i]
        const span = document.createElement('span')
        span.innerText = spanWord
        phraseArea.appendChild(span)
    }
}

// Draw face landmarks onto video
const drawFaceLandmarks = (predictions) => {
    const dots = [...document.querySelectorAll('svg.landmarks circle')]
    const marks = predictions[0]?.landmarks || []
    const tl = predictions[0]?.topLeft || [0, 0]

    // helper to place a single landmark dot
    const placeDot = (dot, mark) => {
        if (!mark || !dot) return
        dot.setAttribute('transform', `translate(${mark[0]}, ${mark[1]})`)
    }

    // Place 3 landmarks
    placeDot(dots[0], marks[0])
    placeDot(dots[1], marks[1])
    placeDot(dots[2], marks[3])
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

    // Display phrase for user
    setNextPhrase()

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

    // ==== WORKING

    const scriptNode = audioCtx.createScriptProcessor(4096, 1, 1)
    source.connect(scriptNode)
    scriptNode.connect(audioCtx.destination)

    // create socket connection
    const connection = io('localhost:3000')
    const { socket } = connection

    // set up socket connection
    socket.emit('audio.transcript.connect')
    socket.on('audio.transcript.result', (data) => {
        console.log('Got transcribed audio', data)
        // === TODO NEXT: Compare this transcript with the ===
        // === current target text. Cross off words, change phrase, etc. ===
    })

    // client-side
    socket.on('connect', () => {
        console.log(socket.id) // x8WIv7-mJelg7on_ALbx
    })
    socket.on('disconnect', () => {
        console.log(socket.id) // undefined
    })

    // binary data handler
    scriptNode.onaudioprocess = (stream) => {
        // if (!emitter.listenerCount('data')) return
        const left = stream.inputBuffer.getChannelData(0)
        const wavData = floatTo16BitPCM(left)
        if (socket && !socket.disconnected) {
            socket.emit('audio.transcript.data', wavData)
        }
    }

    // canvasCtx.clearRect(0, 0, WIDTH, HEIGHT);
    const model = await blazeface.load()

    // Face detection loop
    let faceInterval = setInterval(async () => {
        // class removed, clear
        if (!document.body.classList.contains('tracking')) {
            return clearInterval(faceInterval)
        }

        // class still there, if video is loaded...
        if (videoLoaded) {
            // draw preditions to video
            const predictions = await model.estimateFaces(video)
            drawFaceLandmarks(predictions)
        }
    }, 100)
}
