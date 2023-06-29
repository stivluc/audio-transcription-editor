<template>
  <div>
    <audio ref="audioRef" :src="audioSrc"></audio>
    <button @click="playAudio">Play</button>
    <button @click="pauseAudio">Pause</button>
    <button @click="stopAudio">Stop</button>
    <input type="range" v-model="volume" min="0" max="1" step="0.01" />
    <button @click="toggleMute">{{ isMuted ? 'Unmute' : 'Mute' }}</button>
  </div>
</template>

<script>
export default {
  data() {
    return {
      audioSrc: '/data/Sample1_Audio.wav',
      audio: null,
      volume: 1,
      isMuted: false
    }
  },
  methods: {
    loadAudio() {
      this.audio = new Audio()
      this.audio.src = this.audioSrc
    },
    playAudio() {
      if (!this.audio) {
        this.loadAudio()
      }
      this.audio.play()
    },
    pauseAudio() {
      if (this.audio) {
        this.audio.pause()
      }
    },
    stopAudio() {
      if (this.audio) {
        this.audio.pause()
        this.audio.currentTime = 0
      }
    },
    toggleMute() {
      if (this.audio) {
        this.audio.muted = !this.audio.muted
      }
    }
  },
  mounted() {
    this.loadAudio()
  },

  beforeUnmount() {
    if (this.audio) {
      this.audio.pause()
      this.audio = null
    }
  }
}
</script>
