<template>
  <div id="app">
    <audio-player file="/data/Sample1_Audio.wav"></audio-player>
    <transcription-text></transcription-text>
  </div>
</template>

<script>
import AudioPlayer from './components/AudioPlayer/AudioPlayer.vue'
import TranscriptionText from './components/TranscriptionText.vue'

export default {
  name: 'App',
  components: {
    AudioPlayer,
    TranscriptionText
  }
}
</script>
