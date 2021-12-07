import detectAndDrawEmotions from './detectAndDrawEmotions'
import initAudioVisualizer from './initAudioVisualizer'
import drawFaceLandmarks from './drawFaceLandmarks'
import audioToBuffer from './audioToBuffer'
import setNextPhrase from './setNextPhrase'
import onTranscript from './onTranscript'
import getStream from './getStream'
import io from 'socket.io-client'

// Constants
const EMOTION_THRESHOLD = 66, // between 0 - 100, impossible - easy
    TF_FRAME_RATE = 10

// Init vars
let videoLoaded = false

// Init phase 03
export default async () => {
    // Get user media
    const stream = await getStream()

    // Switch body phrase classes to show the right elements
    document.body.classList.remove('phase-02-active')
    document.body.classList.add('phase-03-active')

    // Set tracking class
    document.body.classList.add('tracking')

    // Set viewbox to stream dims
    const streamW = stream.getVideoTracks()[0].getSettings().width
    const streamH = stream.getVideoTracks()[0].getSettings().height
    const landmarkSVG = document.querySelector('svg.landmarks')
    landmarkSVG.setAttribute('viewBox', `0 0 ${streamW} ${streamH}`)

    // create socket connection
    const socket = io()

    // Show video feed
    var video = document.querySelector('video.face-readout')
    video.dataset.streamWidth = streamW
    video.dataset.streamHeight = streamH
    video.srcObject = stream
    video.onloadedmetadata = async () => {
        video.play()
        await new Promise((res) => setTimeout(res, 100))
        videoLoaded = true

        // Init emotion detection loop
        let emotionInterval = setInterval(() => {
            // class removed, clear
            if (!document.body.classList.contains('tracking')) {
                return clearInterval(emotionInterval)
            }

            detectAndDrawEmotions(video, socket)
        }, 500)
    }

    // Display initial phrase
    // for user to speak
    setNextPhrase()

    // Start drawing the waveforms of the stream
    const audioCtx = new (window.AudioContext || window.webkitAudioContext)()
    const source = initAudioVisualizer(audioCtx, stream)

    // Create new audio processor and feed stream audio into it
    const scriptNode = audioCtx.createScriptProcessor(4096, 1, 1)
    source.connect(scriptNode)
    scriptNode.connect(audioCtx.destination)

    // Signal that the browser is ready to
    // start sending audio
    socket.emit('audio.transcript.connect')

    // Handle transcripts that are sent back from the server
    socket.on('audio.transcript.result', onTranscript)

    // When the audio processor gets new audio data...
    scriptNode.onaudioprocess = (stream) => {
        // Pull raw audio data from the left channel,
        // convert it into a Buffer
        const left = stream.inputBuffer.getChannelData(0)
        const wavData = audioToBuffer(left)

        // Assuming we are still connected,
        // send the raw data to the server
        if (socket && !socket.disconnected) {
            socket.emit('audio.transcript.data', wavData)
        }
    }

    // Load the TensorFlow face detection
    // model (this takes a second)
    const model = await blazeface.load()

    // Init face detection loop
    let faceInterval = setInterval(async () => {
        // make sure "tracking" class is still present
        if (!document.body.classList.contains('tracking')) {
            return clearInterval(faceInterval)
        }

        // class still there, if video is loaded...
        if (videoLoaded) {
            // draw landmarks to video
            const predictions = await model.estimateFaces(video)
            drawFaceLandmarks(predictions)
        }
    }, 1000 / TF_FRAME_RATE)
}
