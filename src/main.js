import './styles/main.scss'

import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import NestedAppConfig from '../NestedApp.config.json'
// Vuetify
import 'vuetify/styles'
import { createVuetify } from 'vuetify'
import * as components from 'vuetify/components'
import * as directives from 'vuetify/directives'

const vuetify = createVuetify({
  components,
  directives
})

const app = createApp(App)

app.use(router)
app.use(vuetify)

app.mount(`#${NestedAppConfig.nestedAppName}`)

// add an event listener to the parent to signal any external Browser if listening
// document
//   .querySelector(`#${NestedAppConfig.nestedAppName}`)
//   .addEventListener('TranscriptionEditor_Initialized', () => {
//     console.log('EVT triggered: Transcription editor app is initialized')
//   })
