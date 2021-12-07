import setNextPhrase from './setNextPhrase'
import FuzzySet from 'fuzzyset.js'
import _get from 'lodash/get'

// Helper to clean punctuation from
// phrase and split it by word
const cleanStrip = (text) => {
    if (!text) return []
    return String(text)
        .replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, '')
        .split(' ')
        .filter(Boolean)
        .map((w) => w.toLowerCase())
}

// Helper to render current score
const setScore = (score) => {
    const scoreText = document.querySelector('.score-box h4')
    scoreText.innerText = String(score).padStart(3, '0')
}

// Primary handler to handle newly detected transcript
export default (data) => {
    // Restore state from DOM
    const activePhrase = document.querySelector('.phrase').dataset.activePhrase
    let pointerWord = document.querySelector('.phrase').dataset.pointerWord || 0
    if (!activePhrase) return

    // Clean & process the active phrase
    const processedPhrase = cleanStrip(activePhrase)

    // Get spoken transcrtipt from data, process, and load into set
    const transcript = _get(data, 'results[0].alternatives[0].transcript', '')
    const transcriptWords = cleanStrip(transcript)
    const transcriptSet = FuzzySet(transcriptWords)

    // Loop and search through words for matches
    let shouldBreak = false
    while (!shouldBreak) {
        // Get current word in active phrase we're looking for
        const targetWord = processedPhrase[pointerWord]
        if (!targetWord) break

        // Fuzzy search for that word in the transcript
        const searchResult = transcriptSet.get(targetWord)
        const isFound = searchResult && _get(searchResult, '[0][0]') > 0.6

        // If we have a match...
        if (isFound) {
            // Get DOM elements for words
            const phraseSpans = [
                ...document.querySelectorAll('.phrase h1 span'),
            ]
            if (phraseSpans[pointerWord]) {
                // Highlight the target word yellow
                phraseSpans[pointerWord].classList.add('spoken')

                // Increment pointer
                pointerWord++

                // If we've reached the end of this phrase...
                if (pointerWord > processedPhrase.length - 1) {
                    // Tell the loop to break
                    shouldBreak = true

                    // Show celebration animation
                    document.body.classList.add('celebrate')

                    // Celebrate for 1.5s, then...
                    setTimeout(() => {
                        // Stop celebration flash
                        document.body.classList.remove('celebrate')

                        // Get score, increment, set
                        let currentScore =
                            document.querySelector('.score-box').dataset
                                .score || 0
                        currentScore++
                        document.querySelector('.score-box').dataset.score =
                            currentScore

                        // Set score in DOM
                        setScore(currentScore)

                        // Get/set next phrase
                        setNextPhrase()
                    }, 1500)
                }
            }
        } else {
            // no word match found,
            // break search loop
            shouldBreak = true
        }
    }

    // Save state in DOM
    document.querySelector('.phrase').dataset.pointerWord = pointerWord
}
