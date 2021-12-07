import drawEmotionChart from './drawEmotionChart'
import VALID_EMOTIONS from './validEmotions'
import detectEmotion from './detectEmotion'
import gameOver from './gameOver'
import _get from 'lodash/get'

let emotionLimitTimer, isOverLimit

export default async (video, socket) => {
    // Detect emotion on this video still
    try {
        const emotionData = await detectEmotion(video, socket)
        const emotions = _get(emotionData, 'people[0].emotions')

        // Check if we're over the emotion threshold,
        // set game end timer accordingly
        const overLimitCheck = Object.keys(emotions).find((emotion) => {
            return VALID_EMOTIONS.includes(emotion) && emotions[emotion] > 66
        })
        if (!isOverLimit && overLimitCheck) {
            clearTimeout(emotionLimitTimer)
            const score =
                document.querySelector('.score-box').dataset.score || 0
            emotionLimitTimer = setTimeout(() => {
                gameOver(score, overLimitCheck, socket)
            }, 1200)
            isOverLimit = true
        } else if (isOverLimit && !overLimitCheck) {
            clearTimeout(emotionLimitTimer)
            isOverLimit = false
        }

        // If detected emotions...
        if (emotions) {
            drawEmotionChart(emotions)
        }
    } catch (err) {
        console.log('Error detecting emotion: ', err)
    }
}
