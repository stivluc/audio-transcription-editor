<template>
  <div class="editor">
    <audio-player
      :file="AUDIO_PATH"
      :trackTitle="AUDIO_TITLE"
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
</template>

<script>
import AudioPlayer from './components/AudioPlayer/AudioPlayer.vue'
import TranscriptionText from './components/TranscriptionText.vue'
import axios from 'axios'
import { generateURL } from './utils/URL_Utils.js'

export default {
  name: 'App',
  mounted() {
    // const urlParams = new URLSearchParams(window.location.search)
    // // this.TRANSCRIPTION_GUID = CURRENT_TRANSCRIPTION || urlParams.get('key')
    // this.TRANSCRIPTION_GUID = null
    // console.log('Transcription Editor recieved GUID: ', this.TRANSCRIPTION_GUID)

    this.bind_default_events()

    this.init()
  },

  beforeUnmount() {
    this.remove_bound_events()
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
      // load if this is development mode from the env files
      IS_DEV: import.meta.env.VITE_IS_DEV == 'true',

      currentTime: 0,
      CONNECTION_CONFIG: null,
      AUDIO_PATH: null,
      AUDIO_TITLE: null,
      TRANSCRIPTION_PATH: null,
      TRANSCRIPTION_GUID: null,
      EXPORT_URL: null
    }
  },
  methods: {
    async init() {
      // let CONFIG_URL = this.IS_DEV
      //   ? `TranscriptionApp_assets/connection.config.DEV.json`
      //   : `TranscriptionApp_assets/connection.config.PROD.json`

      let CONFIG_URL = import.meta.env.VITE_CONNECTION_CONFIG

      if (this.IS_DEV) console.log(`Using Development Configuration File.`)
      if (this.IS_DEV) this.TRANSCRIPTION_GUID = 'DEV'

      // load configuration
      let response = await axios.get(CONFIG_URL)
      this.CONNECTION_CONFIG = response.data

      /* DONT AUTOMATICALLY LOAD PATHS */
      // this.AUDIO_PATH = generateURL(this.CONNECTION_CONFIG.Audio.baseURL)
      // this.TRANSCRIPTION_PATH = generateURL(this.CONNECTION_CONFIG.Transcription.baseURL)
      // this.EXPORT_URL = `${this.CONNECTION_CONFIG.Export.baseURL}`

      // signal any listeners that the app is initialized
      this.$el.parentElement.dispatchEvent(
        new CustomEvent('TranscriptionEditor_Initialized', {
          detail: { APP: this.$el.parentElement }
        })
      )
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
    },

    // ------------------------------------
    //  DOM event listeners
    // ------------------------------------
    bind_default_events() {
      // binding several events to trigger actions from external browser
      this.$el.parentElement.addEventListener(
        'TranscriptionEditor_LoadGUID',
        this.DOMEvent_loadGuid
      )
    },

    remove_bound_events() {
      // cleanup
      this.$el.parentElement.removeEventListener(
        'TranscriptionEditor_LoadGUID',
        this.DOMEvent_loadGuid
      )
    },

    DOMEvent_loadGuid(evt) {
      // console.log('Load GUID Event triggered')

      let param_guid = evt.detail.GUID
      let param_title = evt.detail.title || ''

      this.AUDIO_PATH = generateURL(this.CONNECTION_CONFIG.Audio.baseURL)
      this.TRANSCRIPTION_PATH = generateURL(this.CONNECTION_CONFIG.Transcription.baseURL)

      this.AUDIO_PATH = generateURL(this.CONNECTION_CONFIG.Audio.baseURL, {
        tranID: param_guid
      })
      this.AUDIO_TITLE = param_title

      this.TRANSCRIPTION_PATH = generateURL(this.CONNECTION_CONFIG.Transcription.baseURL, {
        hidsGUID: param_guid
      })

      this.TRANSCRIPTION_GUID = param_guid
      this.EXPORT_URL = `${this.CONNECTION_CONFIG.Export.baseURL}`
    }
  }
}
</script>
