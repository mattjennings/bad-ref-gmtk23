import * as ex from 'excalibur'

// setup global ex variable
globalThis.ex = ex
declare global {
  var ex: typeof ex
}
