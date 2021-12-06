// Draw face landmarks onto video
export default (predictions) => {
    const dots = [...document.querySelectorAll('svg.landmarks circle')]
    const marks = predictions[0]?.landmarks || []

    // helper to place a single landmark dot
    const placeDot = (dot, mark) => {
        if (!mark || !dot) return
        dot.setAttribute('transform', `translate(${mark[0]}, ${mark[1]})`)
    }

    // Place 3 landmarks
    placeDot(dots[0], marks[0])
    placeDot(dots[1], marks[1])
    placeDot(dots[2], marks[3])
}
