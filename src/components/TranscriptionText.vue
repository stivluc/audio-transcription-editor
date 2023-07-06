<template>
  <div class="transcription-container">
    <div class="transcription-content">
      <div class="transcription-text">
        <div
          v-for="(wordInterval, index) in wordIntervals"
          :key="index"
          :class="['transcription-word']"
        >
          <v-menu :close-on-content-click="false" bottom content-class="transcription-popover">
            <template v-slot:activator="{ props }">
              <span
                v-bind="props"
                @click="setIndex(index)"
                :class="[
                  {
                    'highlighted-word': isCurrentPart(wordInterval.interval),
                    'deleted-word': wordInterval.deleted,
                    'added-word': wordInterval.added && !wordInterval.deleted,
                    'modified-word':
                      wordInterval.modified && !wordInterval.deleted && !wordInterval.added
                  }
                ]"
                >{{ wordInterval.word.trim() }}</span
              >
              <span v-if="wordInterval.modified" class="previous-word">{{
                wordInterval.previousWord
              }}</span>
              <span class="space">{{ ' ' }}</span>
            </template>
            <v-list :min-width="180" v-show="isMenuOpen" style="border-radius: 10px">
              <div v-show="!isEditing">
                <v-list-item>
                  <v-btn :elevation="0" text @click="isEditing = 'add'">Add</v-btn>
                </v-list-item>
                <v-list-item>
                  <v-btn :elevation="0" text @click="isEditing = 'edit'">Edit</v-btn>
                </v-list-item>
                <v-list-item>
                  <v-btn :elevation="0" text v-if="isDeleted(index)" @click="restoreWord()"
                    >Restore</v-btn
                  >
                  <v-btn :elevation="0" text v-else @click="deleteWord()">Delete</v-btn>
                </v-list-item>
              </div>
              <div v-show="isEditing">
                <v-list-item>
                  <v-text-field
                    :label="isEditing === 'add' ? 'New word' : 'Modification'"
                    hide-details="auto"
                    ref="editTextField"
                    v-on:keydown.enter="isEditing === 'add' ? addWord($event) : editWord($event)"
                    autofocus
                  />
                </v-list-item>
              </div>
            </v-list>
          </v-menu>
        </div>
      </div>
    </div>
  </div>
  <div class="export-container">
    <img
      class="logo"
      alt="Univ Logo"
      src="https://i.pinimg.com/originals/98/52/43/9852439f1f7db234e2f6e18e3672b996.png"
    />
    <button class="export-button" @click="exportData">
      <span>
        <ExportIcon />
        Export
      </span>
    </button>
  </div>
</template>

<script>
import axios from 'axios'
import { saveAs } from 'file-saver'
import ExportIcon from './icons/ExportIcon.vue'

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
  components: {
    ExportIcon
  },
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
      popoverIndex: null,
      isEditing: false,
      isMenuOpen: false
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
    setIndex(index) {
      this.popoverIndex = index
      setTimeout(() => {
        this.isEditing = false
        this.isMenuOpen = true
      }, 100)
    },
    addWord(event) {
      const newWord = event.target.value
      if (newWord) {
        const previousInterval = this.wordIntervals[this.popoverIndex].interval
        const intervalDifference = previousInterval[1] - previousInterval[0]
        const start = previousInterval[0] + intervalDifference / 2
        const end = previousInterval[1]
        const newInterval = [start, end]

        // Update the interval of the clicked word
        this.wordIntervals[this.popoverIndex].interval = [previousInterval[0], start]

        // Insert the new word with the adjusted interval
        this.wordIntervals.splice(this.popoverIndex + 1, 0, {
          word: newWord,
          interval: newInterval,
          deleted: false,
          added: true,
          modified: false,
          previousWord: null
        })
      }
      this.isMenuOpen = false
      this.isEditing = null
      this.popoverIndex = null
    },
    editWord(event) {
      const modifiedWord = event.target.value
      if (modifiedWord) {
        this.wordIntervals[this.popoverIndex].previousWord =
          this.wordIntervals[this.popoverIndex].word
        this.wordIntervals[this.popoverIndex].word = modifiedWord
        this.wordIntervals[this.popoverIndex].modified = true
      }
      this.isMenuOpen = false
      this.popoverIndex = null
    },
    deleteWord() {
      this.wordIntervals[this.popoverIndex].deleted = true
      this.isMenuOpen = false
      this.popoverIndex = null
    },
    isDeleted(index) {
      return this.wordIntervals[index]?.deleted || false
    },
    restoreWord() {
      this.wordIntervals[this.popoverIndex].deleted = false
      this.isMenuOpen = false
      this.popoverIndex = null
    },
    exportData() {
      const modifiedIntervals = this.wordIntervals.filter((interval) => !interval.deleted)

      const exportedData = modifiedIntervals.map((interval) => interval.word).join(' ')

      // Open the file save dialog
      const blob = new Blob([exportedData], { type: 'text/plain;charset=utf-8' })
      saveAs(blob, 'finalTranscription.txt')
    }
  },
  mounted() {
    this.loadTranscriptions()
  }
}
</script>
