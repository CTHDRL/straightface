import getStream from './getStream'

// Init phase 03
export default async () => {
    // Get user media
    const stream = await getStream()

    // Switch body phrase classes to show the right elements
    document.body.classList.remove('phase-02-active')
    document.body.classList.add('phase-03-active')

    console.log(stream)
}
