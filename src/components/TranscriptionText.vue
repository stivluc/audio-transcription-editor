<template>
  <div class="transcription-container">
    <div class="transcription-content">
      <p class="transcription-text">
        <span v-for="(text, startTime) in transcriptions" :key="startTime">
          <span
            @click="selectWord(startTime)"
            :class="{ 'highlighted-word': selectedWord === startTime }"
          >
            {{ text.trim() }}
          </span>
          <span>&nbsp;</span>
        </span>
      </p>
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
    loadTranscriptions() {
      axios
        .get('/data/Sample1_Transcription.json')
        .then((response) => {
          const jsonData = response.data
          this.transcriptions = Object.keys(jsonData).reduce(
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
    }
  },
  mounted() {
    this.loadTranscriptions()
  }
}
</script>
