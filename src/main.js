import './main.scss'
import initPhaseTwo from './js/initPhaseTwo'
import initPhaseThree from './js/initPhaseThree'

// Listen for phase 01 CTA click
const phaseOneBtn = document.querySelector('.game-phase-01 button')
phaseOneBtn.addEventListener('click', initPhaseTwo)

// Listen for phase 02 CTA click
const phaseTwoBtn = document.querySelector('.game-phase-02 button')
phaseTwoBtn.addEventListener('click', initPhaseThree)

// Parallax
const root = document.documentElement
window.addEventListener('mousemove', (evt) => {
    const x = (evt.x / window.innerWidth) * 2 - 1
    const y = (evt.y / window.innerHeight) * 2 - 1
    root.style.setProperty('--mouse-x', x)
    root.style.setProperty('--mouse-y', y)
})

// Fade in image
setTimeout(
    () =>
        document
            .querySelector('.fullscreen-background')
            .classList.add('visible'),
    400
)

// Reduced motion
const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
if (!mediaQuery || mediaQuery.matches) {
    document.body.classList.add('reduced-motion')
}
