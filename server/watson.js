const WatsonSpeech = require('watson-developer-cloud/speech-to-text/v1')

// create client
const watsonSpeechOps = {
    content_type: 'audio/l16; rate=44100',
    interim_results: true,
    model: 'en-US_BroadbandModel',
    objectMode: true,
}

// create new client if needed
let client
const getClient = () => {
    if (!client) {
        client = new WatsonSpeech({
            username: process.env.WATSON_SPEECH_USERNAME,
            password: process.env.WATSON_SPEECH_PASSWORD,
            url: 'https://stream.watsonplatform.net/speech-to-text/api/',
        })
    }
    return client
}

// function to open new stream
module.exports = () => {
    const speechToText = getClient()
    return speechToText.recognizeUsingWebSocket(watsonSpeechOps)
}
