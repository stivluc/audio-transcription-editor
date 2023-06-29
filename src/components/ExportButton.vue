<template>
  <div>
    <button @click="exportTranscription">Export</button>
  </div>
</template>

<script>
export default {
  methods: {
    exportTranscription() {
      const exportedData = {
        audioSrc: this.$parent.audioSrc,
        transcriptions: this.$parent.$refs.transcriptionRef.transcriptions
      }
      const dataStr = JSON.stringify(exportedData, null, 2)
      const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr)
      const downloadLink = document.createElement('a')
      downloadLink.href = dataUri
      downloadLink.download = 'transcription.json'
      downloadLink.click()
    }
  }
}
</script>
