import copy from 'copy-to-clipboard'

// Helper to translate detected emotion
// to the correct tense for the copy.
const tenseMap = {
    happiness: 'happy',
    sadness: 'sad',
    anger: 'angry',
    disgust: 'disgusted',
    surprise: 'surprised',
}

// Function to end the game from phase 03
export default (score, emotion, socket) => {
    document.body.classList.remove('tracking')

    // Set score into "Game Over" screen
    document.body.querySelector('.game-over-modal .score-value').innerText =
        String(score).padStart(3, '0')

    // Set emotion in correct tense
    document.body.querySelector(
        '.game-over-modal .game-over-copy .emotion'
    ).innerText = tenseMap[emotion]

    // Pause webcam video
    document.body.querySelector('.face-tracking video').pause()

    // Disconnect socket if needed
    if (socket) socket.disconnect()

    // Set share text
    const shareButton = document.querySelector('.game-over-modal .go-share')
    if (shareButton) {
        // Set up share data
        const shareData = {
            title: 'Say It! With a Straight Face',
            text: `I scored ${score} points on Say It! With a Straight Face, but was too ${tenseMap[emotion]} to score any higher. See if you can beat me.`,
            url: window.location.origin,
        }

        // Catch share button click, native share
        shareButton.addEventListener('click', async () => {
            try {
                await navigator.share(shareData)
            } catch (err) {
                copy(`${shareData.text}\n\n${shareData.url}`)
                alert('Copied text to clipboard')
            }
        })
    }

    // Show game over screen
    document.body.classList.add('game-over')
}
