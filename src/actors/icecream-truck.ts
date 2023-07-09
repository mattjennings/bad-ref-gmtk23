import { Engine } from 'excalibur'
import { assets } from 'src/assets'
import MatchScene from 'src/classes/MatchScene'

export class IcecreamTruck extends ex.Actor {
  declare scene: MatchScene

  hasIcecream = true
  isGivingIcecream = false

  animations = {
    PopUp: assets.ase_icecreamTruck.getAnimation('PopUp')!,
    PopDown: assets.ase_icecreamTruck.getAnimation('PopDown')!,
  }

  sprites = {
    hide: assets.ase_icecreamTruck.getSpriteSheet()?.getSprite(0, 0)!,
  }
  constructor() {
    super({
      z: 1,
      collisionType: ex.CollisionType.Fixed,
      width: 80,
      height: 48,
      anchor: ex.vec(0.5, 1),
    })

    this.body.mass = 999999
    this.graphics.use(this.animations.PopUp)
  }

  onInitialize(_engine: Engine): void {
    this.pos = ex.vec(
      this.scene.field.right - this.width / 2,
      this.scene.field.top + this.height + 4
    )

    this.animations.PopUp.events.on('frame', (ev: any) => {
      const isLastFrame = this.animations.PopUp.frames[3].graphic === ev.graphic

      if (isLastFrame) {
        this.animations.PopUp.pause()
      }
    })

    this.animations.PopDown.events.on('loop', () => {
      this.graphics.use(this.sprites.hide)
    })
  }

  update(engine: Engine, delta: number): void {
    const currentAnim = this.graphics.current[0]

    if (this.hasIcecream && currentAnim.graphic !== this.animations.PopUp) {
      this.animations.PopUp.goToFrame(0)
      this.graphics.use(this.animations.PopUp)
      this.animations.PopUp.play()
    }
  }

  giveIcecream() {
    const distractionTime = 10000
    const restockTime = 30000

    if (!this.isGivingIcecream && this.hasIcecream) {
      assets.snd_bell.play()
      this.isGivingIcecream = true
      this.hasIcecream = false
      this.graphics.use(this.animations.PopUp)
      this.animations.PopUp.play()
      this.scene.away.goalie.distract(this, distractionTime)
      this.actions
        .delay(distractionTime)
        .toPromise()
        .then(() => {
          this.isGivingIcecream = false
          this.graphics.use(this.animations.PopDown)
          this.actions
            .moveTo(ex.vec(this.scene.field.right + 100, this.pos.y), 100)
            .delay(restockTime)
            .toPromise()
            .then(() => {
              this.hasIcecream = true
              this.actions.moveTo(
                ex.vec(this.scene.field.right - this.width / 2, this.pos.y),
                100
              )
            })
        })
    }
  }
}
