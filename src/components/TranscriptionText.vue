<template>
  <div class="transcription-container">
    <div class="transcription-content">
      <div class="transcription-text">
        <p
          v-for="wordInterval in wordIntervals"
          :key="wordInterval.interval"
          :class="[
            'transcription-word',
            { 'highlighted-word': isCurrentPart(wordInterval.interval) }
          ]"
        >
          {{ wordInterval.word + ' ' }}
        </p>
      </div>
    </div>
  </div>
</template>

<script>
import axios from 'axios'

function divideTranscriptionWords(transcription) {
  const wordIntervals = {}

  Object.entries(transcription).forEach(([sentence, interval]) => {
    const words = sentence.trim().split(/\s+/)
    const step = (interval[1] - interval[0]) / words.length

    words.forEach((word, index) => {
      const start = interval[0] + index * step
      const end = interval[0] + (index + 1) * step
      const duration = end - start // Calculate the duration for the word
      wordIntervals[start] = { word, interval: [start, end], duration }
    })
  })

  const sortedIntervals = Object.values(wordIntervals).sort((a, b) => a.interval[0] - b.interval[0])

  return sortedIntervals.map(({ word, interval, duration }) => ({
    word,
    interval: interval.join('-'),
    duration
  }))
}

export default {
  props: {
    currentTime: {
      type: Number,
      default: 0
    }
  },
  data() {
    return {
      transcription: {},
      wordIntervals: {},
      editableIntervals: new Set()
    }
  },
  methods: {
    loadTranscriptions() {
      axios
        .get('/data/Sample1_Transcription.json')
        .then((response) => {
          const jsonData = response.data
          this.transcription = jsonData
          this.wordIntervals = divideTranscriptionWords(jsonData)
        })
        .catch((error) => {
          console.error('Error loading transcriptions:', error)
        })
    },
    isCurrentPart(interval) {
      const [start, end] = interval.split('-').map(Number)
      return this.currentTime >= start && this.currentTime < end && this.currentTime > 0
    }
  },
  mounted() {
    this.loadTranscriptions()
  }
}
</script>
