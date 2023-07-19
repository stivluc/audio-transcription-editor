<template>
  <div id="app">
    <div id="editor">
      <audio-player file="/data/Sample2_Audio.wav" @currentTimeChange="updateCurrentTime" />
      <transcription-text :currentTime="currentTime" />
    </div>
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
      this.currentTime = newValue
    }
  }
}
</script>
