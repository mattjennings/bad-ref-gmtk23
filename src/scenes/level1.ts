import { assets } from 'src/assets'
import { Player } from 'src/actors/player'

export default class Level1 extends ex.Scene {
  onInitialize(engine: ex.Engine): void {
    const map = new ex.Actor({
      anchor: ex.Vector.Zero,
    })
    map.graphics.use(assets.img_level1.toSprite())

    const player = new Player({ x: 8 * 16, y: 8 * 16 })

    engine.add(map)
    engine.add(player)

    this.camera.strategy.lockToActor(player)
  }
}
