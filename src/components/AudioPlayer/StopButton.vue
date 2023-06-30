<template>
  <div id="stop">
    <span @click="stop" title="Stop">
      <StopIcon />
    </span>
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
