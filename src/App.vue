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
        :transcriptionKey="TRANSCRIPTION_GUID"
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
import { generateURL } from './utils/URL_Utils.js'
// import ConnectionConfig from '/connection.config.json'

export default {
  name: 'App',
  mounted() {
    const urlParams = new URLSearchParams(window.location.search)
    this.TRANSCRIPTION_GUID = CURRENT_TRANSCRIPTION || urlParams.get('key')

    console.log('Transcription Editor recieved GUID: ', this.TRANSCRIPTION_GUID)
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
      TRANSCRIPTION_GUID: null,
      EXPORT_URL: null
    }
  },
  methods: {
    async FetchAudio() {
      let DEV = true

      let CONFIG_URL = DEV
        ? `TranscriptionApp_assets/connection.config.DEV.json`
        : `TranscriptionApp_assets/connection.config.PROD.json`

      console.log(`Using Dev configuration: ${CONFIG_URL}`)
      // load configuration
      let response = await axios.get(CONFIG_URL)
      let ConnectionConfig = response.data
      // this.AUDIO_PATH = `${ConnectionConfig.baseAudioURL}${this.TRANSCRIPTION_GUID}`
      // this.TRANSCRIPTION_PATH = `${ConnectionConfig.baseTranscriptionURL}${this.TRANSCRIPTION_GUID}`

      this.AUDIO_PATH = DEV
        ? generateURL(ConnectionConfig.Audio.baseURL)
        : generateURL(ConnectionConfig.Audio.baseURL, {
            tranID: this.TRANSCRIPTION_GUID
          })

      this.TRANSCRIPTION_PATH = DEV
        ? generateURL(ConnectionConfig.Transcription.baseURL)
        : generateURL(ConnectionConfig.Transcription.baseURL, {
            hidsGUID: this.TRANSCRIPTION_GUID
          })

      // this.AUDIO_PATH = `/data/Sample2_Audio.mp3`
      // this.TRANSCRIPTION_PATH = `/data/Sample2_Transcription.json`

      this.EXPORT_URL = `${ConnectionConfig.Export.baseURL}`
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
