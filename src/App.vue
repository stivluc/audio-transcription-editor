<template>
  <div id="app">
    <div id="editor">
      <audio-player
        :file="AUDIO_PATH"
        ref="audioPlayer"
        @currentTimeChange="updateCurrentTime"
        @pause-audio="pauseAudio"
        @resume-audio="resumeAudio"
      />
      <transcription-text
        :currentTime="currentTime"
        :transcriptionURL="TRANSCRIPTION_PATH"
        :exportURL="EXPORT_URL"
        @pause-audio="pauseAudio"
        @resume-audio="resumeAudio"
      />
    </div>
  </div>
</template>

<script>
import AudioPlayer from './components/AudioPlayer/AudioPlayer.vue'
import TranscriptionText from './components/TranscriptionText.vue'
import axios from 'axios'

// import ConnectionConfig from '/connection.config.json'

export default {
  name: 'App',
  mounted() {
    this.FetchAudio()
  },
  components: {
    AudioPlayer,
    TranscriptionText
  },
  computed: {
    // audio_file_path() {
    //   return this.AUDIO_PATH
    // }
  },
  data() {
    return {
      currentTime: 0,
      // AUDIO_PATH: ConnectionConfig + 'Yodel_Sound_Effect.mp3'
      // AUDIO_PATH: '/data/Sample2_Audio.wav'
      AUDIO_PATH: null,
      TRANSCRIPTION_PATH: null,
      EXPORT_URL: null
    }
  },
  methods: {
    async FetchAudio() {
      const urlParams = new URLSearchParams(window.location.search)
      const transcriptionAudioKey = urlParams.get('key')

      // get the connection configuration
      // console.log(`${window.location.origin}/connection.config.json`)
      let response = await axios.get(
        `${window.location.origin}/TranscriptionApp_assets/connection.config.json`
      )
      let ConnectionConfig = response.data
      this.AUDIO_PATH = `${ConnectionConfig.baseAudioURL}${transcriptionAudioKey}`
      this.TRANSCRIPTION_PATH = `${ConnectionConfig.baseTranscriptionURL}${transcriptionAudioKey}`

      this.EXPORT_URL = `${ConnectionConfig.exportURL}${transcriptionAudioKey}`
    },
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
