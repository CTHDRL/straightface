const googleStream = require('./google')
const _ = require('lodash')

let gsStream

module.exports = {
    connection(client) {
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
