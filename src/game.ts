import './style.css'
import './globals'
import { loader } from './assets'
import Level1 from './scenes/level1'
import { DevTool } from '@excaliburjs/dev-tools'

const resolution = {
  width: 320, //,ex.Resolution.GameBoyAdvance.width * 1.5,
  // 16:9
  height: 197, //ex.Resolution.GameBoyAdvance.height * 1.5,
}
console.log(resolution)
const game = new ex.Engine({
  canvasElementId: 'game',
  displayMode: ex.DisplayMode.FitScreen,
  // resolution: ex.Resolution.SNES,
  // 16:9
  resolution,
  antialiasing: false,
})

game.add('level1', new Level1())

game.start(loader).then(() => {
  game.goToScene('level1')
})

ex.Physics.checkForFastBodies = true
ex.Physics.useRealisticPhysics()

// const devtool = new DevTool(game)
// game.showDebug(true)
// @ts-ignore
window.showDebug = game.showDebug.bind(game)
