<template>
  <div class="player">
    <div class="player-wrapper">
      <div class="player-controls">
        <PlayButton :playing="playing" @togglePlayback="togglePlayback" />
        <StopButton @stop="stop" />
        <div id="seek" style="width: 100%">
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
            <div class="player-title">
              <p>{{ title }}</p>
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
      <audio
        ref="audio"
        :src="audioSrc"
        @loadeddata="loadAudio"
        @pause="playing = false"
        @play="playing = true"
        preload="auto"
        style="display: none"
      ></audio>
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
    isAudioPlaying: {
      type: Boolean,
      default: false
    }
  },
  data() {
    return {
      audio: null,
      audioSrc: '/data/Sample2_Audio.mp3',
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
  methods: {
    loadAudio() {
      this.audio = new Audio()
      this.audio.src = this.audioSrc
      this.title = this.audioSrc.substring(this.audioSrc.lastIndexOf('/') + 1)

      this.audio.addEventListener('loadeddata', () => {
        this.durationSeconds = Math.floor(this.audio.duration)
        this.loaded = true
      })
      this.audio.addEventListener('ended', () => {
        this.stop()
      })
    },
    togglePlayback() {
      this.playing = !this.playing
    },
    pauseAudio() {
      this.playing = false
    },
    // Method to resume audio playing
    resumeAudio() {
      this.playing = true
    },
    stop() {
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
      if (!this.loaded) return

      const bounds = e.target.getBoundingClientRect()
      const seekPos = (e.clientX - bounds.left) / bounds.width

      this.audio.currentTime = parseInt(this.audio.duration * seekPos)
      this.currentSeconds = parseInt(this.audio.duration * seekPos)
    },
    preview(e) {
      const bounds = e.target.getBoundingClientRect()
      const seekPos = (e.clientX - bounds.left) / bounds.width

      this.currentPosition = parseInt(this.audio.duration * seekPos)
    },
    padTime(time) {
      return time.toString().padStart(2, '0')
    },
    mute() {
      if (this.muted) {
        this.volume = this.previousVolume
      } else {
        this.previousVolume = this.volume
        this.volume = 0
      }
    },
    download() {
      this.audio.pause()

      const link = document.createElement('a')
      link.href = this.audioSrc
      link.download = this.audio.title

      // Programmatically click the link to trigger the download
      link.click()
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
  watch: {
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
  }
}
</script>
