let stream

// Get video stream, requesting access if need be
export default async () => {
    if (stream) return stream
    try {
        stream = await navigator.mediaDevices.getUserMedia({
            video: { width: 640, height: 480, facingMode: 'user' },
            audio: true,
        })

        // Return stream
        return stream
    } catch (err) {
        // Denied, or no camera
        console.log('Failed to get user media')
        alert(
            'You must grant access to your camera and microphone to play the game.'
        )
        return false
    }
}
