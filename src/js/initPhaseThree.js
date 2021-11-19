import audioToBuffer from './audioToBuffer'
import _shuffle from 'lodash/shuffle'
import detectEmotion from './emotion'
import copy from 'copy-to-clipboard'
import { getStream } from './media'
import FuzzySet from 'fuzzyset.js'
import phrases from './phrases'
import _get from 'lodash/get'
import io from './io'

// Constants
const VALID_EMOTIONS = ['happiness', 'anger', 'disgust', 'sadness', 'surprise']
const EMOTION_THRESHOLD = 66 // between 0 - 100, impossible - easy

// Init vars
let videoLoaded = false,
    shuffledPhrases = _shuffle(phrases),
    activePhrase = '',
    pointerWord = 0,
    score = 0

// Helper to clean punctuation from
// phrase and split it by word
const cleanStrip = (text) => {
    if (!text) return []
    return String(text)
        .replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, '')
        .split(' ')
        .filter(Boolean)
        .map((w) => w.toLowerCase())
}

// Pull next phrase from shuffled array and set
const setNextPhrase = () => {
    activePhrase = shuffledPhrases.pop()
    pointerWord = 0

    // Clear out all phrases
    const phraseArea = document.querySelector('.phrase h1')
    while (phraseArea.firstChild) {
        phraseArea.removeChild(phraseArea.firstChild)
    }

    const spans = activePhrase.split(' ').filter(Boolean)
    for (let i in spans) {
        const spanWord = spans[i]
        const span = document.createElement('span')
        span.innerText = spanWord
        phraseArea.appendChild(span)
    }
}

// Helper to render current score
const setScore = () => {
    const scoreText = document.querySelector('.score-box h4')
    scoreText.innerText = String(score).padStart(3, '0')
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

// Draw emotions onto chart
const drawEmotionChart = (emotionData) => {
    const chart = document.querySelector('.emotion-chart')
    if (chart) {
        // Loop emotions and set var value for each
        const emotionBars = VALID_EMOTIONS.map((emotion) =>
            document.querySelector(`.emote-bar .amount.${emotion}`)
        )

        for (let i in VALID_EMOTIONS) {
            const emotion = VALID_EMOTIONS[i]
            const value = emotionData[emotion]
            chart.style.setProperty(`--${emotion}`, value + '%')

            if (value > 66 && !emotionBars[i].classList.contains('alert')) {
                emotionBars[i].classList.add('alert')
            } else if (
                value < 66 &&
                emotionBars[i].classList.contains('alert')
            ) {
                emotionBars[i].classList.remove('alert')
            }
        }
    }
}

// Init phase 03
export default async () => {
    // Get user media
    const stream = await getStream()

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
    const connection = io('localhost:3000')
    const { socket } = connection

    // Show video feed
    var video = document.querySelector('video.face-readout')
    video.dataset.streamWidth = streamW
    video.dataset.streamHeight = streamH
    video.srcObject = stream
    video.onloadedmetadata = async () => {
        video.play()
        await new Promise((res) => setTimeout(res, 100))
        videoLoaded = true

        let emotionLimitTimer, isOverLimit

        // Emotion detection loop
        let emotionInterval = setInterval(async () => {
            // class removed, clear
            if (!document.body.classList.contains('tracking')) {
                return clearInterval(emotionInterval)
            }

            // Detect emotion on this video still
            try {
                const emotionData = await detectEmotion(video, socket)
                const emotions = _get(emotionData, 'people[0].emotions')

                // Check if we're over the emotion threshold,
                // set game end timer accordingly
                const overLimitCheck = Object.keys(emotions).find((emotion) => {
                    return (
                        VALID_EMOTIONS.includes(emotion) &&
                        emotions[emotion] > 66
                    )
                })
                if (!isOverLimit && overLimitCheck) {
                    clearTimeout(emotionLimitTimer)
                    emotionLimitTimer = setTimeout(() => {
                        gameOver(score, overLimitCheck, socket)
                    }, 2600)
                    isOverLimit = true
                } else if (isOverLimit && !overLimitCheck) {
                    clearTimeout(emotionLimitTimer)
                    isOverLimit = false
                }

                // If detected emotions...
                if (emotions) {
                    drawEmotionChart(emotions)
                }
            } catch (err) {
                console.log('Error detecting emotion: ', err)
            }
        }, 1200)
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

    const scriptNode = audioCtx.createScriptProcessor(4096, 1, 1)
    source.connect(scriptNode)
    scriptNode.connect(audioCtx.destination)

    // set up socket connection
    socket.emit('audio.transcript.connect')
    socket.on('audio.transcript.result', (data) => {
        if (!activePhrase) return
        const processedPhrase = cleanStrip(activePhrase)

        const transcript = _get(data, 'results[0].alternatives[0].transcript')
        const transcriptWords = cleanStrip(transcript)
        const transcriptSet = FuzzySet(transcriptWords)

        const targetWord = console.log(transcriptWords)

        let shouldBreak = false
        while (!shouldBreak) {
            const targetWord = processedPhrase[pointerWord]

            const searchResult = transcriptSet.get(targetWord)
            const isFound = searchResult && _get(searchResult, '[0][0]') > 0.6
            console.log(
                targetWord,
                'isFound: ',
                isFound,
                _get(searchResult, '[0][0]')
            )
            if (isFound) {
                const phraseSpans = [
                    ...document.querySelectorAll('.phrase h1 span'),
                ]
                if (phraseSpans[pointerWord]) {
                    phraseSpans[pointerWord].classList.add('spoken')
                    pointerWord++

                    // reached end
                    if (pointerWord > processedPhrase.length - 1) {
                        shouldBreak = true
                        document.body.classList.add('celebrate')
                        setTimeout(() => {
                            document.body.classList.remove('celebrate')
                            score++
                            setScore()
                            setNextPhrase()
                        }, 1500)
                    }
                }
            } else {
                shouldBreak = true
            }
        }
    })

    // binary data handler
    scriptNode.onaudioprocess = (stream) => {
        // if (!emitter.listenerCount('data')) return
        const left = stream.inputBuffer.getChannelData(0)
        const wavData = audioToBuffer(left)
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
