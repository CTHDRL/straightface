import VALID_EMOTIONS from './validEmotions'

// Draw emotions onto chart
export default (emotionData) => {
    // Get chart html el
    const chart = document.querySelector('.emotion-chart')
    if (chart) {
        // Loop emotions and set var value for each
        const emotionBars = VALID_EMOTIONS.map((emotion) =>
            document.querySelector(`.emote-bar .amount.${emotion}`)
        )
        for (let i in VALID_EMOTIONS) {
            const emotion = VALID_EMOTIONS[i]
            const value = emotionData[emotion]
            chart.style.setProperty(`--${emotion}`, value + '%')

            if (value > 66 && !emotionBars[i].classList.contains('alert')) {
                emotionBars[i].classList.add('alert')
            } else if (
                value < 66 &&
                emotionBars[i].classList.contains('alert')
            ) {
                emotionBars[i].classList.remove('alert')
            }
        }
    }
}
