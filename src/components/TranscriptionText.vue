<template>
  <div class="transcription-container">
    <div class="transcription-content">
      <p class="transcription-text">
        <span
          v-for="(text, startTime) in transcriptionText"
          :key="startTime"
          :class="{ 'highlighted-word': isCurrentPart(text) }"
        >
          {{ text.trim() }}
        </span>
      </p>
    </div>
  </div>
</template>

<script>
import axios from 'axios'

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
      transcriptionText: {}
    }
  },
  methods: {
    loadTranscriptions() {
      axios
        .get('/data/Sample1_Transcription.json')
        .then((response) => {
          const jsonData = response.data
          this.transcription = jsonData
          this.transcriptionText = Object.keys(jsonData).reduce(
            (result, key) => ({
              ...result,
              [jsonData[key][0]]: key
            }),
            {}
          )
        })
        .catch((error) => {
          console.error('Error loading transcriptions:', error)
        })
    },
    isCurrentPart(text) {
      const [startTime, endTime] = this.transcription[text]
      if (this.currentTime >= startTime && this.currentTime < endTime && this.currentTime > 0) {
        return true
      }
      return false
    }
  },
  mounted() {
    this.loadTranscriptions()
  }
}
</script>
