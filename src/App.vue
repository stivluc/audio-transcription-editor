<template>
  <div id="app">
    <div id="editor">
      <audio-player
        file="/data/Sample2_Audio.wav"
        ref="audioPlayer"
        @currentTimeChange="updateCurrentTime"
        @pause-audio="pauseAudio"
        @resume-audio="resumeAudio"
      />
      <transcription-text
        :currentTime="currentTime"
        @pause-audio="pauseAudio"
        @resume-audio="resumeAudio"
      />
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
    },
    // Method to pause the audio
    pauseAudio() {
      this.$refs.audioPlayer.pauseAudio()
    },
    // Method to resume audio playing
    resumeAudio() {
      this.$refs.audioPlayer.resumeAudio()
    }
  }
}
</script>
