const dotenv = require('dotenv')
dotenv.config()

const express = require('express')
const { connection } = require('./io')

// create server
const app = express()
const server = require('http').createServer(app)
const io = require('socket.io')(server, {
    cors: {
        origin: '*',
        methods: ['GET', 'POST'],
    },
})

// handle socket connections
io.on('connection', connection)
io.on('error', (err) => {
    console.log('Caught Socket ERR:', err)
})

// Static app
// app.use(express.static('dist'))

// start server
const port = process.env.PORT || 5000
server.listen(port, () => {
    console.log(`listening on port ${port}...`)
})
