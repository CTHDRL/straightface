import './main.scss'
import initPhaseTwo from './js/initPhaseTwo'
import initPhaseThree from './js/initPhaseThree'

// Listen for phase 01 CTA click
const phaseOneBtn = document.querySelector('.game-phase-01 button')
phaseOneBtn.addEventListener('click', initPhaseTwo)

// Listen for phase 02 CTA click
const phaseTwoBtn = document.querySelector('.game-phase-02 button')
phaseTwoBtn.addEventListener('click', initPhaseThree)
