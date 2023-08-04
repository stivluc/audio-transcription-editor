<template>
  <div class="player">
    <div class="player-wrapper">
      <div class="player-controls">
        <PlayButton :playing="playing" @togglePlayback="togglePlayback" />
        <StopButton @stop="stop" />
        <div id="seek">
          <div class="player-timeline-wrapper">
            <div class="player-timeline">
              <div :style="progressStyle" class="player-progress"></div>
              <div
                @click="seek"
                @mouseenter="hovering = true"
                @mouseleave="hovering = false"
                @mousemove="preview"
                class="player-seeker"
                title="Seek"
              ></div>
            </div>
          </div>
          <div class="player-time">
            <div class="player-time-current">{{ formattedCurrentTime }}</div>

            <!-- show status message until title is available -->
            <div class="player-title">
              <p v-if="title != ''">{{ trackTitle }}</p>
              <p v-else>{{ this.audioStatus }}</p>
            </div>
            <div class="player-time-total">{{ formattedDuration }}</div>
          </div>
        </div>
        <div id="volume">
          <span
            id="volume-span"
            @mouseenter="showVolume = true"
            @mouseleave="showVolume = false"
            :title="volumeTitle"
          >
            <VolumeIcon />
            <input
              v-model.lazy.number="volume"
              v-show="showVolume"
              class="player-volume"
              type="range"
              min="0"
              max="100"
            />
          </span>
        </div>
        <div id="mute" v-show="!showVolume">
          <span @click="mute" title="Mute">
            <MuteIcon v-if="!muted" />
            <UnmuteIcon v-else />
          </span>
        </div>
        <DownloadButton @download="download" v-show="!showVolume" />
      </div>
      <div class="audio_dump">
        <!-- <audio
        v-if="this.audioSrc"
        ref="audio"
        :src="audioSrc"
        @durationchange="audioTrackLoaded_evt"
        @loadeddata="audioFrameLoaded_evt"
        @pause="playing = false"
        @play="playing = true"
        @ended="audioEnded_evt"
        @error="audioError_evt"
        type="audio/mpeg"
        preload="auto"
        style="display: none"
      ></audio> -->
      </div>
    </div>
  </div>
</template>

<script>
import PlayButton from './PlayButton.vue'
import StopButton from './StopButton.vue'
import DownloadButton from './DownloadButton.vue'
import MuteIcon from '../icons/MuteIcon.vue'
import UnmuteIcon from '../icons/UnmuteIcon.vue'
import VolumeIcon from '../icons/VolumeIcon.vue'
import axios from 'axios'

export default {
  components: {
    PlayButton,
    StopButton,
    DownloadButton,
    MuteIcon,
    UnmuteIcon,
    VolumeIcon
  },
  props: {
    file: {
      type: String,
      default: null
    },
    trackTitle: {
      type: String,
      default: null
    },
    isAudioPlaying: {
      type: Boolean,
      default: false
    }
  },
  data() {
    return {
      audio: null,
      // audioSrc: '/data/Sample2_Audio.mp3',
      audioStatus: 'No Audio Loaded',
      audioSrc: null,
      currentSeconds: 0,
      currentPosition: 0,
      durationSeconds: 0,
      loaded: false,
      playing: false,
      previousVolume: 35,
      showVolume: false,
      hovering: false,
      volume: 100,
      title: '',
      timer: null
    }
  },
  watch: {
    file(value) {
      // console.log(`AudioFile Changed
      // from: ${this.audioSrc},
      // to: ${value}`)

      // console.log(`in audio src watch with: ${value}`)
      if (value != this.audioSrc)
        if (value) {
          if (value != this.audioSrc) this.audioSrc = value

          this.loadAudio()
        } else {
          this.audioStatus = 'No Audio Loaded'
        }
    },
    playing(value) {
      if (value) {
        this.timer = setInterval(() => {
          this.currentSeconds = this.audio.currentTime
          this.$emit('currentTimeChange', this.audio.currentTime)
        }, 100)
        return this.audio.play()
      }
      clearInterval(this.timer)
      this.audio.pause()
    },
    volume() {
      this.audio.volume = this.volume / 100
    }
  },
  computed: {
    muted() {
      return this.volume / 100 === 0
    },
    percentComplete() {
      if (this.hovering) {
        return parseInt((this.currentPosition / this.durationSeconds) * 100)
      }
      return parseInt((this.currentSeconds / this.durationSeconds) * 100)
    },
    progressStyle() {
      return { width: `${this.percentComplete}%` }
    },
    volumeTitle() {
      return `Volume (${this.volume}%)`
    },
    formattedCurrentTime() {
      return this.convertedTimeMMSS(this.currentSeconds)
    },
    formattedDuration() {
      return this.convertedTimeMMSS(this.durationSeconds)
    },
    convertedTimeMMSS() {
      return (time) => {
        let hhmmss = new Date(time * 1000).toISOString().substring(11, 19)

        return hhmmss.indexOf('00:') === 0 ? hhmmss.substring(3) : hhmmss
      }
    }
  },
  methods: {
    // -------------------------------------------
    // SETUP
    // -------------------------------------------
    loadAudio() {
      // console.log(`in load audio: ${this.audioSrc}`)
      if (this.audioSrc == null) return

      // console.log(`Loading Audio: ${this.audioSrc}`)

      // ADD IN AN AJAX CALL HERE FOR THE SOURCE THEN SET THE AUDIO ELEMENT
      axios(this.audioSrc, {
        responseType: 'arraybuffer',
        headers: {
          'Content-Type': 'audio/mpeg'
        }
      })
        .then((res) => {
          // console.log('Audio axios success!')
          // console.log(res)

          let blob = new Blob([res.data])

          // console.log(blob)

          let url = URL.createObjectURL(blob)
          // console.log(url)

          if (this.audio) this.audio.remove()

          this.audio = new Audio()
          this.audio.src = url

          this.audio.addEventListener('durationchange', this.audioTrackLoaded_evt)
          this.audio.addEventListener('loadeddata', this.audioFrameLoaded_evt)
          this.audio.addEventListener('ended', this.audioEnded_evt)
          this.audio.addEventListener('error', this.audioError_evt)
          this.audio.addEventListener('play', () => {
            this.playing = true
          })
          this.audio.addEventListener('pause', () => {
            this.playing = false
          })

          this.$el.querySelector('.audio_dump').append(this.audio)
          // console.log(this.audio)
          // this.EMIT_Status_Event('TranscriptionEditor_audioLoaded', 'success')
        })
        .catch((err) => {
          // console.log('Audio axios error!', err)

          this.EMIT_Status_Event('TranscriptionEditor_audioLoaded', 'failed')
        })

      // this.audio = new Audio()
      // this.audio.src = this.audioSrc
    },

    // -------------------------------------------
    // CONTROLS
    // -------------------------------------------
    togglePlayback() {
      // console.log(this.audio)
      if (!this.audio) {
        return
      }
      this.playing = !this.playing
    },
    pauseAudio() {
      if (!this.audio) return
      this.playing = false
    },
    // Method to resume audio playing
    resumeAudio() {
      if (!this.audio) return
      this.playing = true
    },
    stop() {
      if (!this.audio) return
      this.playing = false
      if (this.audio) {
        this.audio.currentTime = 0
        this.currentSeconds = 0
        this.$emit('currentTimeChange', this.audio.currentTime)
        this.audio.pause()
      }
      clearInterval(this.timer)
    },
    seek(e) {
      if (!this.audio) return
      if (!this.loaded) return

      const bounds = e.target.getBoundingClientRect()
      const seekPos = (e.clientX - bounds.left) / bounds.width

      this.audio.currentTime = parseInt(this.audio.duration * seekPos)
      this.currentSeconds = parseInt(this.audio.duration * seekPos)
    },
    preview(e) {
      if (!this.audio) return
      const bounds = e.target.getBoundingClientRect()
      const seekPos = (e.clientX - bounds.left) / bounds.width

      this.currentPosition = parseInt(this.audio.duration * seekPos)
    },
    padTime(time) {
      return time.toString().padStart(2, '0')
    },
    mute() {
      if (!this.audio) return
      if (this.muted) {
        this.volume = this.previousVolume
      } else {
        this.previousVolume = this.volume
        this.volume = 0
      }
    },
    download() {
      if (!this.audio) return
      this.audio.pause()

      const link = document.createElement('a')
      link.href = this.audioSrc
      link.download = this.audio.title

      // Programmatically click the link to trigger the download
      link.click()
    },

    // -------------------------------------------
    // INTERFACE EVENTS
    // -------------------------------------------
    audioTrackLoaded_evt() {
      // console.log(`AUDIO: audioTrackLoaded_evt fired`)

      this.title = this.audioSrc.substring(this.audioSrc.lastIndexOf('/') + 1)
      this.EMIT_Status_Event('TranscriptionEditor_audioLoaded', 'success')
    },
    audioFrameLoaded_evt() {
      // console.log(`AUDIO: audioFrameLoaded_evt fired`)
      if (!this.audio) return
      this.durationSeconds = Math.floor(this.audio.duration)

      this.loaded = true
    },
    audioEnded_evt() {
      // console.log(`AUDIO: audioEnded_evt fired`)
      this.stop()
    },
    audioError_evt() {
      // console.log(`AUDIO: audioError_evt fired`)
      this.audioStatus = 'Failed To Load Audio'

      this.EMIT_Status_Event('TranscriptionEditor_audioLoaded', 'failed')
    },

    EMIT_Status_Event(event_name, status) {
      this.$root.$el.parentElement.dispatchEvent(
        new CustomEvent(event_name, {
          detail: { status: status }
        })
      )
    }
  }
}
</script>
