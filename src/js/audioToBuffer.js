import { Buffer } from 'buffer'

/**
 * Accepts a Float32Array of audio data and converts it to a Buffer of l16 audio data (raw wav)
 *
 * Explanation for the math: The raw values captured from the Web Audio API are
 * in 32-bit Floating Point, between -1 and 1 (per the specification).
 * The values for 16-bit PCM range between -32768 and +32767 (16-bit signed integer).
 * Filter & combine samples to reduce frequency, then multiply to by 0x7FFF (32767) to convert.
 * Store in little endian.
 *
 * @param {Float32Array} input
 * @return {Buffer}
 */
export default (input) => {
    var output = new DataView(new ArrayBuffer(input.length * 2)) // length is in bytes (8-bit), so *2 to get 16-bit length
    for (var i = 0; i < input.length; i++) {
        var multiplier = input[i] < 0 ? 0x8000 : 0x7fff // 16-bit signed range is -32768 to 32767
        output.setInt16(i * 2, (input[i] * multiplier) | 0, true) // index, value, little edian
    }
    return Buffer.from(output.buffer)
}
