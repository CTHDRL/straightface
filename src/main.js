import './style.scss'
import initPhaseTwo from './phaseTwo'
import initPhaseThree from './PhaseThree'

// Listen for main CTA click
const phaseOneBtn = document.querySelector('.game-phase-01 button')
phaseOneBtn.addEventListener('click', () => {
    initPhaseTwo()
})

// Listen for main CTA click
const phaseTwoBtn = document.querySelector('.game-phase-02 button')
phaseTwoBtn.addEventListener('click', () => {
    initPhaseThree()
})
