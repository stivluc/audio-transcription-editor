<template>
  <div id="stop">
    <a @click.prevent="stop" title="Stop" href="#">
      <StopIcon />
    </a>
  </div>
</template>

<script>
import StopIcon from '../icons/StopIcon.vue'

export default {
  methods: {
    stop() {
      this.$emit('stop')
    }
  },
  components: {
    StopIcon
  }
}
</script>
