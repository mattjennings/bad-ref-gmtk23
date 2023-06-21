import './style.css'
import './globals'
import { loader } from './assets'
import Level1 from './scenes/level1'

const game = new ex.Engine({
  canvasElementId: 'game',
  displayMode: ex.DisplayMode.FitScreen,

  // we can change this to whatever
  resolution: ex.Resolution.GameBoyAdvance,
  antialiasing: false,
})

game.add('level1', new Level1())

game.start(loader).then(() => {
  game.goToScene('level1')
})
