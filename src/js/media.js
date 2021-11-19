let stream

// Get video stream, requesting access if need be
export const getStream = async () => {
    if (stream) return stream
    try {
        stream = await navigator.mediaDevices.getUserMedia({
            video: { width: 640, height: 480, facingMode: 'user' },
            audio: true,
        })

        // "Remember" that we have access to this device
        // Cookies.set('has_allowed_media', true, { expires: 365 * 100 })
        // faceEvents.$emit('user_allowed_media')

        // Return stream
        return stream
    } catch (err) {
        // Denied, or no camera
        console.log('Failed to get user media')
        // Cookies.remove('has_allowed_media')
        return false
    }
}
