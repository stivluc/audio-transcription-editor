<template>
  <div ref="container" class="transcription-container">
    <div class="transcription-content">
      <div class="transcription-text">
        <div
          v-for="(word, index) in transcriptionWords"
          :key="index"
          :class="['transcription-word', { 'current-word': isCurrentPart(word.time_period) }]"
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
                >{{ word.Corrected.trim() === '' ? word.Init.trim() : word.Corrected.trim() }}
              </span>
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
import { generateURL } from '@/utils/URL_Utils.js'
// import { saveAs } from 'file-saver'

function divideTranscriptionWords(transcription) {
  const transcriptionWords = {}

  transcription.forEach((sentence) => {
    // create an array with the words in a sentence,
    // Use Corrected words if they exist, otherwise use the Init (AI) values
    const words = sentence.Corrected
      ? sentence.Corrected.trim().split(/\s+/)
      : sentence.Init.trim().split(/\s+/)

    // const corrections = sentence.Corrected.trim().split(/\s+/) // Create an array with the words within a sentence
    const step = (sentence.time_period[1] - sentence.time_period[0]) / words.length // Calculate the approximate time by word for the audio based on the time_period divided by the number of words

    // console.log("init:", words);
    // console.log('corrections:', corrections)

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
    transcriptionURL: {
      type: String,
      default: null
    },
    transcriptionKey: {
      type: String,
      default: null
    },

    exportURL: {
      type: String,
      default: null
    },
    currentTime: {
      type: Number,
      default: 0
    }
  },
  emits: ['pause-audio', 'resume-audio'],
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
    getCurrentWord_element() {
      return this.$refs.container.querySelector('.highlighted-word')
    },

    highlightedWord_offset() {
      let currentWord = this.getCurrentWord_element()
      let offset = 0
      if (currentWord) {
        let container_offset = this.$refs.container.getBoundingClientRect().top
        let word_offset = this.getCurrentWord_element().getBoundingClientRect().top
        offset = word_offset - container_offset
      }

      return offset
    },

    transcriptionContainer_height() {
      return this.$refs.container.offsetHeight
    },

    loadTranscriptions() {
      // console.log(`loading transcriptions: ${this.transcriptionURL}`)
      if (this.transcriptionURL == null) return

      axios
        // .get('/data/Sample2_Transcription.json')
        .get(this.transcriptionURL)
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
    // Emit an event to pause the audio when clicking on a word
    pauseAudio() {
      this.$emit('pause-audio')
    },
    // Emit an event to resume audio playing when editing is finished
    resumeAudio() {
      this.$emit('resume-audio')
    },
    async exportData() {
      console.log(`exporting to: ${this.exportURL}`)

      const reconstructedSentences = reconstructSentences(
        this.transcription,
        this.transcriptionWords.filter((word) => word.Corrected.trim() !== '') // Remove deleted words
      )

      const exportedData = JSON.stringify(reconstructedSentences, null, 2)

      let uploadURL = generateURL(
        this.exportURL
        //, {
        // hidsGUID: this.transcriptionKey,
        // myJson: exportedData
        //}
      )

      console.log(uploadURL)

      axios
        .post(
          uploadURL,
          {
            hidsGUID: this.transcriptionKey,
            myJson: exportedData
          },
          {
            headers: {
              // Overwrite Axios's automatically set Content-Type
              'Content-Type': 'application/x-www-form-urlencoded'
            }
          }
        )
        .then(() => {
          alert('Transcription Edits Posted! You may return to pip!')
        })
        .catch(function (error) {
          alert('There was an error posting your Transcription!')
          console.log(error.toJSON())
        })
    }
  },
  watch: {
    transcriptionURL(value) {
      // console.log(`in TranscriptionURL watch with: ${value}`)
      if (value) {
        this.loadTranscriptions()
      }
    },
    isMenuOpen(value) {
      if (value) {
        this.pauseAudio()
      } else {
        this.resumeAudio()
      }
    },
    currentTime() {
      let buffer = this.transcriptionContainer_height() * 0.1

      if (this.getCurrentWord_element()) {
        let outOfBounds =
          this.highlightedWord_offset() + buffer > this.transcriptionContainer_height() ||
          this.highlightedWord_offset() - buffer < 0
        if (outOfBounds) {
          this.getCurrentWord_element().scrollIntoView({
            //   top: this.highlightedWord_offset() - buffer,
            behavior: 'smooth',
            block: 'center'
          })
          // console.log('out of bounds, scroll to nearest word ')
        }
      }
    }
  },
  mounted() {
    this.loadTranscriptions()
  }
}
</script>
