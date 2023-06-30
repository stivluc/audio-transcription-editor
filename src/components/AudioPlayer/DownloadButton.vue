<template>
  <div id="download">
    <a @click.prevent="handleClick" href="#" title="Download">
      <DownloadIcon />
    </a>
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
