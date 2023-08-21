/* 
Helper class for outputting log messages 
    so i can have an always there debug logger without having to remove it
    every commit

    to use:

    import LOGGER from "path/to/this/file/Logger"

    let myLogger = new LOGGER({
            active: import.meta.env.VITE_IS_DEV == "true", // sample of using env to set active
            label: "Poller",
            mode: "dev only log",
        })

    // to use 
    myLogger.log('string')    
    myLogger.warn('string')    
    myLogger.alert('string')    

    // output will show in console as '[mode if set]label: the string'
    // so it's easily identifiable

*/
export default class LOGGER {
  constructor({ active = true, label, mode }) {
    this._label = label
    this._mode = mode
    this._active = active
  }

  setActive(newValue = true) {
    this._active = newValue
  }
  _formatted_message(logString) {
    return `${this._mode ? `[${this._mode}]` : ""}${this._label}: ${logString}`
  }
  log(logString) {
    if (this._active) console.log(this._formatted_message(logString))
  }

  warn(logString) {
    if (this._active) console.warn(this._formatted_message(logString))
  }
  alert(logString) {
    if (this._active) console.error(this._formatted_message(logString))
  }
}
