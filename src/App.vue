<template>
  <div id="app">
    <audio-player :audio-src="audioSrc"></audio-player>
    <transcription-text></transcription-text>
    <button @click="exportTranscription">Export</button>
    <export-button></export-button>
  </div>
</template>

<script>
import AudioPlayer from './components/AudioPlayer.vue'
import TranscriptionText from './components/TranscriptionText.vue'

export default {
  name: 'App',
  components: {
    AudioPlayer,
    TranscriptionText
  }
}
</script>
