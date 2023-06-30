<template>
  <div id="play">
    <a @click.prevent="handleClick" :title="playing ? 'Pause' : 'Play'" href="#">
      <PlayIcon v-if="!playing" />
      <PauseIcon v-else />
    </a>
  </div>
</template>

<script>
import PlayIcon from '../icons/PlayIcon.vue'
import PauseIcon from '../icons/PauseIcon.vue'

export default {
  props: {
    playing: {
      type: Boolean,
      required: true
    }
  },
  emits: ['togglePlayback'],
  methods: {
    handleClick() {
      this.$emit('togglePlayback')
    }
  },
  components: {
    PlayIcon,
    PauseIcon
  }
}
</script>
