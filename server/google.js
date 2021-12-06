const { SpeechClient } = require('@google-cloud/speech')

// ops
const googleSpeechOps = {
    config: {
        encoding: 'LINEAR16',
        sampleRateHertz: 44100,
        languageCode: 'en-US',
        profanityFilter: false,
        enableWordTimeOffsets: true,
    },
    interimResults: true,
}

// create new client if needed
let client
const getClient = () => {
    if (!client)
        client = new SpeechClient({
            credentials: {
                client_email: process.env.GOOGLE_SPEECH_EMAIL,
                private_key: process.env.GOOGLE_SPEECH_KEY,
            },
        })
    return client
}

// function to open new stream
module.exports = () => {
    const speech = getClient()
    return speech.streamingRecognize(googleSpeechOps)
}
