import _shuffle from 'lodash/shuffle'
import phrases from './phrases'

const shuffledPhrases = _shuffle(phrases)

// Pull next phrase from shuffled array and set
export default () => {
    const nextPhrase = shuffledPhrases.pop()
    if (!nextPhrase) alert(`You win! You completed all the phrases.`)
    const phraseEl = document.querySelector('.phrase')
    phraseEl.dataset.activePhrase = nextPhrase
    phraseEl.dataset.pointerWord = 0

    // Clear out all phrases
    const phraseArea = document.querySelector('.phrase h1')
    while (phraseArea.firstChild) {
        phraseArea.removeChild(phraseArea.firstChild)
    }

    const spans = nextPhrase.split(' ').filter(Boolean)
    for (let i in spans) {
        const spanWord = spans[i]
        const span = document.createElement('span')
        span.innerText = spanWord
        phraseArea.appendChild(span)
    }
}
