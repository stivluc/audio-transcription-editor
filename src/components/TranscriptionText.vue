<template>
  <div class="transcription-container">
    <div class="transcription-content">
      <div v-for="(text, startTime) in transcriptions" :key="startTime">
        <span
          @click="selectWord(startTime)"
          :class="{ 'highlighted-word': selectedWord === startTime }"
          >{{ getDisplayedText(startTime) }}</span
        >
      </div>
    </div>
    <button @click="revertLastEdit" v-if="editedText">Revert Last Edit</button>
  </div>
</template>

<script>
import axios from 'axios'

export default {
  data() {
    return {
      transcriptions: {},
      selectedWord: null,
      editedText: ''
    }
  },
  methods: {
    selectWord(startTime) {
      if (this.selectedWord === startTime) {
        this.$refs.audioRef.currentTime = startTime
        this.$refs.audioRef.play()
      } else {
        this.selectedWord = startTime
        this.editedText = this.transcriptions[startTime]
      }
    },
    revertLastEdit() {
      if (this.selectedWord) {
        this.editedText = ''
        this.selectedWord = null
      }
    },
    getDisplayedText(startTime) {
      if (this.selectedWord === startTime) {
        return this.editedText
      } else {
        return this.transcriptions[startTime]
      }
    },
    loadTranscriptions() {
      axios
        .get('/data/Sample1_Transcription.json')
        .then((response) => {
          this.transcriptions = response.data
        })
        .catch((error) => {
          console.error('Error loading transcriptions:', error)
        })
    }
  },
  mounted() {
    this.loadTranscriptions()
  }
}
</script>
