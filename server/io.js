const facePlusPlus = require('./facePlusPlus')
const googleStream = require('./google')
const _ = require('lodash')

let gsStream

// FacePlusPlus Serializers
const serializeFaceDetect = (data) => {
    return {
        id: data.image_id,
        faces: data.faces.map((face) => {
            return {
                rectangle: face.face_rectangle,
                token: face.face_token,
            }
        }),
    }
}
const serializeFaceAnalyze = (data) => {
    return {
        people: _.get(data, 'faces', []).map((face) => {
            const landmark = face.landmark || {}
            return {
                person_id: face.face_token,
                demographics: {
                    gender: _.get(face, 'attributes.gender.value', 'unknown'),
                    age: _.get(face, 'attributes.age.value', 'unknown'),
                },
                emotions: _.get(face, 'attributes.emotion', {}),
                landmarks: Object.keys(landmark).map((key) => {
                    const pos = landmark[key]
                    return {
                        [key]: pos,
                    }
                }),
                rectangle: face.face_rectangle,
            }
        }),
    }
}

module.exports = {
    connection(client) {
        // Listen for video snapshots
        client.on('video.analysis.snapshot', async (dataURL) => {
            try {
                const detectData = await facePlusPlus.detect(dataURL)
                const detectFormatted = serializeFaceDetect(detectData)
                client.emit('video.detect.result', detectFormatted)

                // if we have any faces, get the first token and analyze
                const token = _.get(detectFormatted, 'faces[0].token')
                if (token) {
                    const analysisData = await facePlusPlus.analyze(token)
                    client.emit(
                        'video.analysis.result',
                        serializeFaceAnalyze(analysisData)
                    )
                }
            } catch (err) {
                console.log('err: ', err)
                client.emit('server.error', err)
            }
        })

        // internal vars
        let disconnected = false
        let timer = null

        // Handle error, log and pass to client
        const streamError = (err) => {
            console.log(`STREAM ERR: ${err}`)
            client.emit('server.error', err)
        }
        client.on('error', streamError)

        // looping speech connection
        const startConnection = () => {
            clearTimeout(timer)

            gsStream = googleStream()
                .on('error', streamError)
                .on('data', (data) => {
                    // do something with this data
                    client.emit('audio.transcript.result', data)
                })

            // enforce 60 sec timeout
            timer = setTimeout(() => {
                disconnectSpeech()
                if (!disconnected) startConnection()
            }, 60 * 1000)
        }

        // on connection
        client.on('audio.transcript.connect', startConnection)

        // on data
        client.on('audio.transcript.data', (data) => {
            if (gsStream !== null) gsStream.write(data)
        })

        // disconnect google
        const disconnectSpeech = () => {
            if (gsStream !== null) {
                gsStream.end()
                gsStream = null
            }
        }

        // Fully kill connection
        const killConnection = () => {
            if (!disconnected) {
                disconnected = true
                disconnectSpeech()
            }
        }

        // disconnect listeners
        client.on('audio.transcript.disconnect', killConnection)
        client.on('disconnect', killConnection)
    },
}
