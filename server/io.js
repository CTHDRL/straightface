const watsonStream = require('./watson')
// const facePlusPlus = require('../services/facePlusPlus')
const ss = require('socket.io-stream')
const _ = require('lodash')

// serializers
// const faceAnalyzerSerializer = require('../serializers/facePlusAnalyze')
// const faceDetectSerializer = require('../serializers/facePlusDetect')
// const googleSerializer = require('../serializers/googleSpeech')

module.exports = {
    connection(client) {
        console.log('new socket connection')

        // // Listen for video snapshots
        // ss(client).on('video.analysis.snapshot', async stream => {
        //     try {
        //         const detectData = await facePlusPlus.detect(stream)
        //         const detectFormatted = faceDetectSerializer(detectData)
        //         client.emit('video.detect.result', detectFormatted)
        //
        //         // if we have any faces, get the first token and analyze
        //         const token = _.get(detectFormatted, 'faces[0].token')
        //         if (token) {
        //             const analysisData = await facePlusPlus.analyze(token)
        //             client.emit(
        //                 'video.analysis.result',
        //                 faceAnalyzerSerializer(analysisData)
        //             )
        //         }
        //     } catch (err) {
        //         client.emit('server.error', err)
        //     }
        // })

        // init streams
        let wtStream = null

        // internal vars
        let disconnected = false
        let timer = null

        const streamError = (err) => {
            console.log(`STREAM ERR: ${err}`)
            client.emit('server.error', err)
        }
        client.on('error', streamError)

        // looping speech connection
        const startConnection = () => {
            clearTimeout(timer)
            wtStream = watsonStream()
                .on('error', streamError)
                .on('data', (data) => {
                    // do something with this data
                    client.emit('audio.transcript.result', data)
                })
            // gsStream = googleStream()
            //     .on('error', streamError)
            //     .on('data', data => {
            //
            //     })

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
            if (wtStream !== null) wtStream.write(data)
        })

        // disconnect google
        const disconnectSpeech = () => {
            if (wtStream !== null) {
                wtStream.end()
                wtStream = null
            }
        }

        // Fully kill connection
        const killConnection = () => {
            if (!disconnected) {
                console.log('Connection end.')
                disconnected = true
                disconnectSpeech()
            }
        }

        // disconnect listeners
        client.on('audio.transcript.disconnect', killConnection)
        client.on('disconnect', killConnection)
    },
}
