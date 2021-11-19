import { contain } from 'intrinsic-scale'

let canvas, ctx

// Resolution of video snapshot
const SNAP_RES = 150

// canvas blob promise helper
const canvasToBlob = (canvas) => {
    return new Promise((resolve, reject) => {
        try {
            return canvas.toBlob(resolve, 'image/jpeg', 0.5)
        } catch (e) {
            return reject(e)
        }
    })
}

export default async (video, socket) => {
    // Set up canvas  if  not set up yet
    if (!canvas) {
        canvas = document.createElement('canvas')
        canvas.width = SNAP_RES
        canvas.height = SNAP_RES
        ctx = canvas.getContext('2d')
    }

    // draw video frame to canvas
    const { width, height, x, y } = contain(
        SNAP_RES,
        SNAP_RES,
        video.dataset.streamWidth,
        video.dataset.streamHeight
    )
    ctx.drawImage(video, x, y, width, height)

    // create blob and stream to server
    // const blob = await canvasToBlob(canvas)
    // const blobStream = ss.createStream()

    const imageURL = canvas.toDataURL('image/jpeg', 0.5)

    // Return promise
    return new Promise((resolve, reject) => {
        if (socket && !socket.disconnected) {
            // stream blob to server for analysis
            socket.emit('video.analysis.snapshot', imageURL)
            // ss.createBlobReadStream(blob).pipe(blobStream)

            // Handle result and unlisten
            const onData = (data) => {
                socket.offAny(onData)
                socket.offAny(onError)
                return resolve(data)
            }

            // Handle error and unlisten
            const onError = (err) => {
                socket.offAny(onError)
                socket.offAny(onData)
                return reject(data)
            }

            // Wait for video analysis result
            socket.on('video.analysis.result', onData)
            socket.on('error', onError)
        } else {
            // No connection, error
            return reject('No socket connection.')
        }
    })
}
