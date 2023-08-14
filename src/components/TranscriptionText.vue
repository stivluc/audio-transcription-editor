<template>
  <div ref="container" class="transcription-container">
    <div class="transcription-content">
      <div class="transcription-text">
        <!-- add a status message for when transcription not loaded -->
        <div class="transcription-status" v-if="Object.keys(transcriptionWords).length == 0">
          {{ this.transcriptionStatus }}
        </div>

        <div
          v-else
          v-for="(word, index) in transcriptionWords"
          :key="index"
          :class="['transcription-word', { 'current-word': isCurrentPart(word.time_period) }]"
        >
          <v-menu
            v-model="shownModals[index]"
            :close-on-content-click="false"
            bottom
            content-class="transcription-popover"
          >
            <template v-slot:activator="{ props }">
              <span
                v-bind="props"
                @click="wordClicked_evt"
                :data-wordID="index"
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
            <v-list
              :min-width="180"
              v-show="index == selectedWordIndex"
              style="border-radius: 10px"
            >
              <div v-show="!isEditing">
                <div class="transcription-popover-listitem">
                  <button :elevation="0" text @click="isEditing = 'add'">Add</button>
                </div>
                <div class="transcription-popover-listitem">
                  <button :elevation="0" text @click="isEditing = 'edit'">Edit</button>
                </div>
                <div class="transcription-popover-listitem">
                  <button :elevation="0" text v-if="isDeleted(index)" @click="restoreWord()">
                    Restore
                  </button>
                  <button :elevation="0" text v-else @click="deleteWord()">Delete</button>
                </div>
              </div>
              <div v-show="isEditing">
                <div class="transcription-popover-listitem">
                  <v-text-field
                    :label="isEditing === 'add' ? 'New word' : 'Modification'"
                    hide-details="auto"
                    ref="editTextField"
                    v-on:keydown.enter="editorSubmission_evt"
                    autofocus
                  />
                </div>
              </div>
            </v-list>
          </v-menu>
        </div>
      </div>
    </div>
  </div>
  <div class="transcription-controls-container">
    <button class="transcription-control" @click="copyText_evt">
      <ClipboardIcon></ClipboardIcon> {{ copyText }}
    </button>

    <button class="transcription-control save" @click="exportData">Save</button>
  </div>
</template>

<script>
import axios from 'axios'
import { generateURL } from '@/utils/URL_Utils.js'
import { saveAs } from 'file-saver'
import ClipboardIcon from './icons/ClipboardIcon.vue'

function divideTranscriptionWords(transcription) {
  const transcriptionWords = {}

  transcription.forEach((sentence) => {
    // create an array with the words in a sentence,
    // Use Corrected words if they exist, otherwise use the Init (AI) values
    // corrected is null on first run
    const words =
      sentence.Corrected != null
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
      transcriptionStatus: 'No Transcription Loaded',

      shownModals: {},

      selectedWordIndex: null,
      isEditing: null,
      focusMenu: false,
      // not the best implementation, but short on time
      copyText: 'Copy To Clipboard'
    }
  },
  mounted() {
    this.loadTranscriptions()
    // define method of manual download of transcription data
    document.MANUAL_TRANSCRIPT_DOWNLOAD = () => {
      // Open the file save dialog
      let exportData = this.getExportData()
      const blob = new Blob([exportData], { type: 'text/plain;charset=utf-8' })
      saveAs(blob, 'finalTranscription.json')
    }
  },
  watch: {
    // need to map a shown value to each menu to catch the open/close events
    shownModals: {
      handler(newValue) {
        // set active menu

        // if any active modals
        if (Object.keys(newValue).some((key) => newValue[key])) {
          this.isEditing = null
          this.focusMenu = true

          // this.pauseAudio()
        } else {
          this.focusMenu = false
          // this.resumeAudio()
        }
      },
      deep: true
    },

    transcriptionURL(value) {
      // console.log(`in TranscriptionURL watch with: ${value}`)
      if (value) {
        this.loadTranscriptions()
      } else {
        // remove old transcription if null (prevent memory leak)
        this.transcription = {}
        this.transcriptionWords = {}
        this.transcriptionStatus = 'No Transcription Loaded'
      }
    },

    focusMenu(value) {
      if (value == true) {
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
  methods: {
    editorSubmission_evt(evt) {
      if (this.isEditing === 'add') {
        this.addWord(evt)
      } else {
        this.editWord(evt)
      }

      this.focusMenu = false
    },
    wordClicked_evt(evt) {
      this.setIndex(evt.target.getAttribute('data-wordID'))
    },
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
      // console.log(`Loading Transcription: ${this.transcriptionURL}`)
      if (this.transcriptionURL == null) return
      this.transcriptionStatus = 'Loading Transcription...'
      axios
        // .get('/data/Sample2_Transcription.json')
        .get(this.transcriptionURL, {
          params: {
            hidsGUID: this.transcriptionKey
          }
        })
        .then((response) => {
          const jsonData = response.data
          this.transcription = jsonData
          this.transcriptionWords = divideTranscriptionWords(jsonData)
          this.$root.$el.parentElement.dispatchEvent(
            new CustomEvent('TranscriptionEditor_transcriptionLoaded', {
              detail: { status: 'success' }
            })
          )
        })
        .catch((error) => {
          console.error('Error loading transcriptions:', error)
          this.transcriptionStatus = 'Transcription Loading Failed!'
          this.$root.$el.parentElement.dispatchEvent(
            new CustomEvent('TranscriptionEditor_transcriptionLoaded', {
              detail: { status: 'failed' }
            })
          )
        })
    },
    isCurrentPart(interval) {
      const start = interval[0]
      const end = interval[1]
      return this.currentTime >= start && this.currentTime < end && this.currentTime > 0
    },

    setIndex(index) {
      // console.log('in setIndex', index)
      this.selectedWordIndex = parseInt(index)

      // setTimeout(() => {
      //   console.log('running setIndex timeout')
      //   this.isEditing = false
      //   // this.isMenuOpen = true
      // }, 100)
    },
    addWord(event) {
      const newWord = event.target.value
      if (newWord) {
        const previousInterval = this.transcriptionWords[this.selectedWordIndex].time_period
        const timePeriodDifference = previousInterval[1] - previousInterval[0]
        const start = previousInterval[0] + timePeriodDifference / 2
        const end = previousInterval[1]
        const newTimePeriod = [start, end]

        // Update the time_period of the clicked word
        this.transcriptionWords[this.selectedWordIndex].time_period = [previousInterval[0], start]
        // Insert the new word with the adjusted time_period
        this.transcriptionWords.splice(this.selectedWordIndex + 1, 0, {
          Init: '',
          time_period: newTimePeriod,
          Corrected: newWord
        })
      }
      // this.isMenuOpen = false
      // this.isEditing = null
      this.selectedWordIndex = null
    },
    editWord(event) {
      const modifiedWord = event.target.value
      if (modifiedWord) {
        this.transcriptionWords[this.selectedWordIndex].Corrected = modifiedWord
      }
      // this.isMenuOpen = false
      this.selectedWordIndex = null
    },
    deleteWord() {
      this.transcriptionWords[this.selectedWordIndex].Corrected = ''
      // this.isMenuOpen = false
      this.selectedWordIndex = null

      this.focusMenu = false
    },
    isDeleted(index) {
      return this.transcriptionWords[index]?.Corrected === '' || false
    },
    restoreWord() {
      this.transcriptionWords[this.selectedWordIndex].Corrected =
        this.transcriptionWords[this.selectedWordIndex].Init
      // this.isMenuOpen = false
      this.selectedWordIndex = null
      this.focusMenu = false
    },
    // Emit an event to pause the audio when clicking on a word
    pauseAudio() {
      this.$emit('pause-audio')
    },
    // Emit an event to resume audio playing when editing is finished
    resumeAudio() {
      this.$emit('resume-audio')
    },
    getExportData() {
      const reconstructedSentences = reconstructSentences(
        this.transcription,
        this.transcriptionWords.filter((word) => word.Corrected.trim() !== '') // Remove deleted words
      )
      return JSON.stringify(reconstructedSentences, null, 2)
    },
    async exportData() {
      // console.log(`exporting to: ${this.exportURL}`)
      const exportedData = this.getExportData()
      let uploadURL = generateURL(this.exportURL)
      // console.log(uploadURL)
      // axios doesn't retain 'this' reference. so i'm cheating
      let self = this
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
          // alert('Transcription Edits Posted! You may return to pip!')
          // console.log('Transcription submit SUCCESS!')
          self.$root.$el.parentElement.dispatchEvent(
            new CustomEvent('TranscriptionEditor_transcriptionSubmitted', {
              detail: { status: 'success' }
            })
          )
        })
        .catch(function (error) {
          // alert('There was an error posting your Transcription!')
          // console.log('Transcription submit FAILED!')
          // console.log(error.toJSON())
          self.$root.$el.parentElement.dispatchEvent(
            new CustomEvent('TranscriptionEditor_transcriptionSubmitted', {
              detail: { status: 'failed', error }
            })
          )
        })
    },

    getCurrentText() {
      let raw_text_string = this.transcriptionWords
        .filter((word) => word.Corrected.trim() !== '')
        .map((word) => word.Corrected || word.Init)
        .join(' ')

      return raw_text_string
    },

    copyText_evt(evt) {
      evt.target.classList.add('copied')
      this.copyText = 'Copied!'

      let formattedText = this.getCurrentText()
      // write the formatted text to the clipboard
      navigator.clipboard.writeText(formattedText)

      setTimeout(() => {
        evt.target.classList.remove('copied')
        this.copyText = 'Copy to Clipboard'
      }, 3000)
    }
  },
  components: { ClipboardIcon }
}
</script>
