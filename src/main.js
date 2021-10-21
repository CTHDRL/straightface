import initPhaseTwo from './phaseTwo'
import './style.scss'

// Listen for main CTA click
const btn = document.querySelector('.game-phase-01 button')
btn.addEventListener('click', () => {
    initPhaseTwo()
})
