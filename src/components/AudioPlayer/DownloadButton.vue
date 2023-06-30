<template>
  <div id="download">
    <span @click="handleClick" title="Download">
      <DownloadIcon />
    </span>
  </div>
</template>

<script>
import DownloadIcon from '../icons/DownloadIcon.vue'

export default {
  emits: ['download'],
  methods: {
    handleClick() {
      this.$emit('download')
    }
  },
  components: {
    DownloadIcon
  }
}
</script>
