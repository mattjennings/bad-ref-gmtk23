import { Engine } from 'excalibur'
import { assets } from 'src/assets'
import MatchScene from 'src/classes/MatchScene'
import { Ball } from './ball'

export class Net extends ex.Actor {
  declare scene: MatchScene
  team: 'home' | 'away'

  constructor({ team, ...args }: ex.ActorArgs & { team: 'home' | 'away' }) {
    const anchor = ex.vec(0, 0.85)
    const graphic =
      team === 'home'
        ? assets.img_netLeftBack.toSprite()
        : assets.img_netRightBack.toSprite()
    super({
      ...args,
      name: `net_${team}`,
      anchor,
      width: graphic.width,
      height: graphic.height,
    })
    this.team = team
    this.graphics.use(graphic)
  }

  onInitialize(engine: Engine): void {
    // 144 = height of net sprite
    const anchorPxOffset = 144 * (1 - this.anchor.y)

    // set position of net
    const x = this.team === 'home' ? 0 * 16 : 50 * 16
    const y = Math.round(11 * 16 + anchorPxOffset)
    this.pos = ex.vec(x, y)

    const topPost = this.pos.y - this.height * this.anchor.y + 60
    const bottomPost = this.pos.y

    let topBack: ex.Vector,
      topFront: ex.Vector,
      bottomBack: ex.Vector,
      bottomFront: ex.Vector

    if (this.team === 'home') {
      topBack = ex.vec(this.pos.x + 16, topPost)
      topFront = ex.vec(this.pos.x + this.width - 4, topPost)

      bottomBack = ex.vec(this.pos.x, bottomPost)
      bottomFront = ex.vec(this.pos.x + this.width - 16, bottomPost)
    } else {
      topBack = ex.vec(this.pos.x + this.width - 16, topPost)
      topFront = ex.vec(this.pos.x + 4, topPost)

      bottomBack = ex.vec(this.pos.x + this.width, bottomPost)
      bottomFront = ex.vec(this.pos.x + 12, bottomPost)
    }

    // posts
    engine.add(
      new ex.Actor({
        name: 'posts',
        collisionType: ex.CollisionType.Fixed,
        collider: new ex.CompositeCollider([
          new ex.EdgeCollider({
            begin: topBack,
            end: topFront,
          }),
          new ex.EdgeCollider({
            begin: bottomBack,
            end: bottomFront,
          }),
          new ex.EdgeCollider({
            begin: topBack,
            end: bottomBack,
          }),
        ]),
      })
    )

    // goal line
    const goalLine = new ex.Actor({
      name: 'goalLine',
      collisionType: ex.CollisionType.Passive,
      collider: new ex.EdgeCollider({
        begin: topFront.add(ex.vec(this.team === 'home' ? -12 : 12, 4)),
        end: bottomFront.add(ex.vec(this.team === 'home' ? -12 : 12, -2)),
      }),
    })

    goalLine.on('collisionstart', (ev) => {
      if (ev.other instanceof Ball) {
        this.scene.emit('goal', {
          team: this.team === 'home' ? 'away' : 'home',
        })
      }
    })
    engine.add(goalLine)
  }
}
