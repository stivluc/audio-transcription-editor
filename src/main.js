import './styles/main.scss'

import { createApp } from 'vue'
import App from './App.vue'
// import router from './router'
import NestedAppConfig from '../NestedApp.config.json'
// Vuetify
// import 'vuetify/styles'
import { createVuetify } from 'vuetify'
import * as components from 'vuetify/components'
import * as directives from 'vuetify/directives'

// const vuetify = createVuetify({
//   components,
//   directives
// })

// const app = createApp(App)
// app.use(router)
// app.use(vuetify)
// app.mount(`#${NestedAppConfig.nestedAppName}`)
const vuetify = createVuetify({
  components,
  directives
})

/**
 * Event handler to mount the App to a specified target
 * @param {CustomEvent} evt event expected to pass a 'details' object containing a target
 * target can either be a dom element or a selector
 *
 * e.g. document.dispatchEvent(new CustomEvent('...',  {
 * 'details': {target: "example"}
 * }))
 */
function mountApp_evt(evt) {
  let target = evt.detail.target || `#${NestedAppConfig.nestedAppName}`
  const app = createApp(App)
  app.use(vuetify)
  app.mount(target)
}

document
  // .querySelector(`#${NestedAppConfig.nestedAppName}`)
  .addEventListener('TranscriptionEditor_Mount', mountApp_evt)
