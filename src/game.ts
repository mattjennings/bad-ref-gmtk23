import './style.css'
import './globals'
import { loader } from './assets'
import Level1 from './scenes/level1'

const game = new ex.Engine({
  canvasElementId: 'game',
  displayMode: ex.DisplayMode.FitScreen,
  resolution: ex.Resolution.GameBoyAdvance,
  antialiasing: false,
})

game.add('level1', new Level1())

game.start(loader).then(() => {
  game.goToScene('level1')
})

ex.Physics.checkForFastBodies = true
ex.Physics.useRealisticPhysics()
// ex.Physics.acc = ex.vec(0, 300)

globalThis.debug = true
