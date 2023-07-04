<template>
  <div class="word-popover">
    <button @click="addWord">Add Word</button>
    <button @click="modifyWord">Modify Word</button>
    <button @click="deleteWord">Delete Word</button>
  </div>
</template>

<script>
export default {
  methods: {
    addWord() {
      this.$emit('add') // Emit the 'add' event to the parent component
    },
    modifyWord() {
      this.$emit('modify') // Emit the 'modify' event to the parent component
    },
    deleteWord() {
      this.$emit('delete') // Emit the 'delete' event to the parent component
    }
  }
}
</script>

<style scoped>
.word-popover {
  position: absolute;
  top: 20px;
  left: 0;
  background-color: #fff;
  padding: 10px;
  border: 1px solid #ccc;
}
</style>
