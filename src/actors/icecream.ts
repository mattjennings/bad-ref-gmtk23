import { Engine } from 'excalibur'
import { assets } from 'src/assets'

export class Icecream extends ex.Actor {
  startY = 0
  ignoreYSort = true

  constructor(args: ex.ActorArgs) {
    super({
      ...args,
    })

    this.startY = this.pos.y
    this.graphics.use(assets.ase_icecreamCone.getAnimation('Float')!)
  }

  onInitialize(_engine: Engine): void {
    this.scene.add(new Celebration({ pos: this.pos, z: this.z + 1 }))
    this.actions.delay(1000).fade(0, 200).die()
  }
  update(engine: Engine, delta: number): void {
    // float up and down from startY +/- 10px
    this.pos.y = this.startY + Math.sin(this.startY / 10) * 10
  }
}

class Celebration extends ex.Actor {
  ignoreYSort = true
  constructor(args: any) {
    super(args)
  }

  onInitialize(_engine: Engine): void {
    const anim = assets.ase_collectCelebration.getAnimation('Celebrate')!
    this.graphics.use(anim.clone())

    this.actions.delay(1000).die()
  }
}
