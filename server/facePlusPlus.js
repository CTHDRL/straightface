const rp = require('request-promise')

// take a snapshot stream and run face detection
const detect = async (dataURL) => {
    // Relay snapshot to faceplusplus
    const base64 = dataURL.replace(/^data:image\/(png|jpg);base64,/, '')
    const result = await rp.post({
        url: 'https://api-us.faceplusplus.com/facepp/v3/detect',
        formData: {
            api_key: process.env.FACE_PLUS_KEY,
            api_secret: process.env.FACE_PLUS_SECRET,
            image_base64: base64,
        },
    })
    return JSON.parse(result)
}

// Receive a valid face token and run
// through analysis for enotion data, etc
const analyze = async (token) => {
    const result = await rp.post({
        url: 'https://api-us.faceplusplus.com/facepp/v3/face/analyze',
        formData: {
            api_key: process.env.FACE_PLUS_KEY,
            api_secret: process.env.FACE_PLUS_SECRET,
            face_tokens: token,
            return_landmark: 1,
            return_attributes: 'gender,age,emotion,facequality',
        },
    })
    return JSON.parse(result)
}

exports.detect = detect
exports.analyze = analyze
