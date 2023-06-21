import { Engine } from 'excalibur'
import { assets } from 'src/assets'

const spritesheet = ex.SpriteSheet.fromImageSource({
  image: assets.img_player,
  grid: {
    rows: 1,
    columns: 4,
    spriteWidth: 32,
    spriteHeight: 32,
  },
  spacing: {
    margin: {
      x: 1,
      y: 0,
    },
  },
})

const animations = {
  idle: ex.Animation.fromSpriteSheet(spritesheet, ex.range(1, 4), 200),
}

export class Player extends ex.Actor {
  constructor(args: ex.ActorArgs) {
    super({
      ...args,
      anchor: ex.Vector.Zero,
    })

    this.graphics.use(animations.idle)
  }
}
