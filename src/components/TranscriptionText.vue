<template>
  <div class="transcription-container">
    <div class="transcription-content">
      <div class="transcription-text">
        <div
          v-for="(wordInterval, index) in wordIntervals"
          :key="wordInterval.interval"
          :class="['transcription-word']"
          @click="showPopover(index)"
        >
          <span
            :class="[
              {
                'highlighted-word': isCurrentPart(wordInterval.interval),
                'deleted-word': wordInterval.deleted,
                'added-word': wordInterval.added,
                'modified-word': wordInterval.modified
              }
            ]"
            >{{ wordInterval.word.trim() }}</span
          >
          <span v-if="wordInterval.modified" class="previous-word">{{
            wordInterval.previousWord
          }}</span>
          <span class="space">{{ ' ' }}</span>
          <div class="word-popover" v-show="showingPopover && popoverIndex === index">
            <button @click="addWord()">Add Word</button>
            <button @click="modifyWord()">Modify Word</button>
            <button v-if="isDeleted(index)" @click="restoreWord()">Restore Word</button>
            <button v-else @click="deleteWord()">Delete Word</button>
          </div>
        </div>
        <!-- Popover -->
      </div>
    </div>
  </div>
</template>

<script>
import axios from 'axios'

function divideTranscriptionWords(transcription) {
  const wordIntervals = {}

  Object.entries(transcription).forEach(([sentence, interval]) => {
    const words = sentence.trim().split(/\s+/) // Create an array with the words within a sentence
    const step = (interval[1] - interval[0]) / words.length // Calculate the approximate time by word for the audio based on the interval divided by the number of words

    words.forEach((word, index) => {
      const start = interval[0] + index * step
      const end = interval[0] + (index + 1) * step
      wordIntervals[start] = { word, interval: [start, end] }
    })
  })

  const sortedIntervals = Object.values(wordIntervals).sort((a, b) => a.interval[0] - b.interval[0])

  return sortedIntervals.map(({ word, interval }) => ({
    word,
    interval: interval,
    deleted: false, // Initialize the deleted attribute to false
    added: false,
    modified: false, // Initialize the modified attribute to false
    previousWord: null // Initialize the previousWord attribute to null
  }))
}

export default {
  props: {
    currentTime: {
      type: Number,
      default: 0
    }
  },
  data() {
    return {
      transcription: {},
      wordIntervals: {},
      showingPopover: false,
      popoverIndex: null
    }
  },
  methods: {
    loadTranscriptions() {
      axios
        .get('/data/Sample1_Transcription.json')
        .then((response) => {
          const jsonData = response.data
          this.transcription = jsonData
          this.wordIntervals = divideTranscriptionWords(jsonData)
        })
        .catch((error) => {
          console.error('Error loading transcriptions:', error)
        })
    },
    isCurrentPart(interval) {
      const start = interval[0]
      const end = interval[1]
      return this.currentTime >= start && this.currentTime < end && this.currentTime > 0
    },
    showPopover(index) {
      this.showingPopover = true
      this.popoverIndex = index
    },
    hidePopover() {
      this.showingPopover = false
      this.popoverIndex = null
    },
    addWord() {
      const newWord = prompt('Enter the new word:')
      if (newWord) {
        const currentIndex = this.popoverIndex
        this.wordIntervals.splice(currentIndex + 1, 0, {
          word: newWord,
          interval: [0, 0],
          deleted: false,
          added: true,
          modified: false,
          previousWord: null
        })
      }
      this.hidePopover()
    },
    modifyWord() {
      const modifiedWord = prompt('Modify the word:', this.wordIntervals[this.popoverIndex].word)
      if (modifiedWord) {
        this.wordIntervals[this.popoverIndex].previousWord =
          this.wordIntervals[this.popoverIndex].word
        this.wordIntervals[this.popoverIndex].word = modifiedWord
        this.wordIntervals[this.popoverIndex].modified = true
      }
      this.hidePopover()
    },
    deleteWord() {
      this.wordIntervals[this.popoverIndex].deleted = true
      this.hidePopover()
    },
    isDeleted(index) {
      return this.wordIntervals[index]?.deleted || false
    },
    restoreWord() {
      this.wordIntervals[this.popoverIndex].deleted = false
      this.hidePopover()
    }
  },
  mounted() {
    this.loadTranscriptions()
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
  z-index: 99;
}
</style>
