<template>
  <div id="app">
    <audio-player
      file="/data/Sample1_Audio.wav"
      @currentTimeChange="updateCurrentTime"
    ></audio-player>
    <transcription-text :currentTime="currentTime"></transcription-text>
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
  },
  data() {
    return {
      currentTime: 0
    }
  },
  methods: {
    updateCurrentTime(newValue) {
      console.log(newValue)
      this.currentTime = newValue
    }
  }
}
</script>
