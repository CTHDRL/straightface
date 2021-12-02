import initAudioVisualizer from './initAudioVisualizer'
import setNextPhrase from './setNextPhrase'
import getStream from './getStream'

// Init phase 03
export default async () => {
    // Get user media
    const stream = await getStream()

    // Switch body phrase classes to show the right elements
    document.body.classList.remove('phase-02-active')
    document.body.classList.add('phase-03-active')

    // Set tracking class
    document.body.classList.add('tracking')

    const streamW = stream.getVideoTracks()[0].getSettings().width
    const streamH = stream.getVideoTracks()[0].getSettings().height

    // Show video feed
    var video = document.querySelector('video.face-readout')
    video.dataset.streamWidth = streamW
    video.dataset.streamHeight = streamH
    video.srcObject = stream
    video.onloadedmetadata = async () => {
        video.play()
    }

    // Display initial phrase
    // for user to speak
    setNextPhrase()

    // Start drawing the waveforms of the stream
    const audioCtx = new (window.AudioContext || window.webkitAudioContext)()
    const source = initAudioVisualizer(audioCtx, stream)
}
