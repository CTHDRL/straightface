const { createServer: createViteServer } = require('vite')
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

// Start server
;(async () => {
    // Create Vite server in middleware mode.
    const vite = await createViteServer({
        server: { middlewareMode: 'html' },
    })

    // Use vite's connect instance as middleware
    app.use(vite.middlewares)

    const port = process.env.PORT || 3000
    server.listen(port, () => {
        console.log(`listening on port ${port}...`)
    })
})()
