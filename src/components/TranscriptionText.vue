<template>
  <div class="transcription-container">
    <div class="transcription-content">
      <div class="transcription-text">
        <div
          v-for="(word, index) in transcriptionWords"
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
                    'highlighted-word': isCurrentPart(word.time_period),
                    'deleted-word': word.Corrected === '',
                    'added-word': word.Init === '',
                    'modified-word':
                      word.Corrected !== word.Init && word.Corrected !== '' && word.Init !== ''
                  }
                ]"
                >{{ word.Corrected.trim() === '' ? word.Init.trim() : word.Corrected.trim() }}</span
              >
              <span v-if="word.Corrected !== word.Init" class="previous-word">{{ word.Init }}</span>
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
    <div></div>
    <button class="export-button" @click="exportData">
      <span> Finalize </span>
    </button>
  </div>
</template>

<script>
import axios from 'axios'
import { saveAs } from 'file-saver'

function divideTranscriptionWords(transcription) {
  const transcriptionWords = {}

  transcription.forEach((sentence) => {
    const words = sentence.Init.trim().split(/\s+/) // Create an array with the words within a sentence
    const step = (sentence.time_period[1] - sentence.time_period[0]) / words.length // Calculate the approximate time by word for the audio based on the time_period divided by the number of words

    words.forEach((value, index) => {
      const start = sentence.time_period[0] + index * step
      const end = sentence.time_period[0] + (index + 1) * step
      transcriptionWords[start] = { value, time_period: [start, end] }
    })
  })

  const sortedIntervals = Object.values(transcriptionWords).sort(
    (a, b) => a.time_period[0] - b.time_period[0]
  )

  return sortedIntervals.map(({ value, time_period }) => ({
    Init: value,
    time_period: time_period,
    Corrected: value
  }))
}

function reconstructSentences(transcription, transcriptionWords) {
  const sentences = []

  transcription.forEach((sentence) => {
    const sentenceTimePeriod = sentence.time_period
    const sentenceWords = transcriptionWords.filter((word) => {
      return (
        word.time_period[0] >= sentenceTimePeriod[0] && word.time_period[1] <= sentenceTimePeriod[1]
      )
    })
    const reconstructedSentence = sentenceWords.map((word) => word.Corrected).join(' ')
    sentences.push({
      Init: sentence.Init,
      time_period: sentence.time_period,
      Corrected: reconstructedSentence
    })
  })

  return sentences
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
      transcriptionWords: {},
      popoverIndex: null,
      isEditing: false,
      isMenuOpen: false
    }
  },
  methods: {
    loadTranscriptions() {
      axios
        .get('/data/Sample2_Transcription.json')
        .then((response) => {
          const jsonData = response.data
          this.transcription = jsonData
          this.transcriptionWords = divideTranscriptionWords(jsonData)
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
        const previousInterval = this.transcriptionWords[this.popoverIndex].time_period
        const timePeriodDifference = previousInterval[1] - previousInterval[0]
        const start = previousInterval[0] + timePeriodDifference / 2
        const end = previousInterval[1]
        const newTimePeriod = [start, end]

        // Update the time_period of the clicked word
        this.transcriptionWords[this.popoverIndex].time_period = [previousInterval[0], start]

        // Insert the new word with the adjusted time_period
        this.transcriptionWords.splice(this.popoverIndex + 1, 0, {
          Init: '',
          time_period: newTimePeriod,
          Corrected: newWord
        })
      }
      this.isMenuOpen = false
      this.isEditing = null
      this.popoverIndex = null
    },
    editWord(event) {
      const modifiedWord = event.target.value
      if (modifiedWord) {
        this.transcriptionWords[this.popoverIndex].Corrected = modifiedWord
      }
      this.isMenuOpen = false
      this.popoverIndex = null
    },
    deleteWord() {
      this.transcriptionWords[this.popoverIndex].Corrected = ''
      this.isMenuOpen = false
      this.popoverIndex = null
    },
    isDeleted(index) {
      return this.transcriptionWords[index]?.Corrected === '' || false
    },
    restoreWord() {
      this.transcriptionWords[this.popoverIndex].Corrected =
        this.transcriptionWords[this.popoverIndex].Init
      this.isMenuOpen = false
      this.popoverIndex = null
    },
    exportData() {
      const reconstructedSentences = reconstructSentences(
        this.transcription,
        this.transcriptionWords.filter((word) => word.Corrected.trim() !== '') // Remove deleted words
      )

      const exportedData = JSON.stringify(reconstructedSentences, null, 2)

      // Open the file save dialog
      const blob = new Blob([exportedData], { type: 'text/plain;charset=utf-8' })
      saveAs(blob, 'finalTranscription.json')
    }
  },
  mounted() {
    this.loadTranscriptions()
  }
}
</script>
