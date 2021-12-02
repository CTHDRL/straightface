// Create and start waveform visualizer
export default (audioCtx, stream) => {
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

    // Define draw function
    function draw() {
        // Stop loop if this class does not exist
        if (document.body.classList.contains('tracking')) {
            requestAnimationFrame(draw)
        }

        // Get amplitudes of freq bands from analyser
        analyser.getByteFrequencyData(dataArray)

        // Erase Canvas
        canvasCtx.fillStyle = 'rgb(0, 0, 0)'
        canvasCtx.fillRect(0, 0, WIDTH, HEIGHT)

        // set bar dimensions
        var barWidth = (WIDTH / bufferLength) * 2.5
        var barHeight
        var x = 0

        // Loop bars/bands and set their heights accordingly
        for (var i = 0; i < bufferLength; i++) {
            barHeight = (dataArray[i] / 200) * (HEIGHT * 0.75)

            canvasCtx.fillStyle = '#F4FF00'
            canvasCtx.fillRect(x, HEIGHT / 2 - barHeight / 2, 2, barHeight)

            x += barWidth + 1
        }
    }

    // Kick loop
    draw()

    return source
}
