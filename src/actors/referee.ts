import { Engine } from 'excalibur'
import { BasePlayer } from './base-player'
import { assets } from 'src/assets'
import { DirectionQueue } from 'src/classes/DirectionQueue'
import { Ball } from './ball'
import { TeamPlayer } from './team-player'

const controls = {
  left: ex.Input.Keys.A,
  right: ex.Input.Keys.D,
  up: ex.Input.Keys.W,
  down: ex.Input.Keys.S,
  whistle: ex.Input.Keys.Enter,
  context: ex.Input.Keys.Space,
}

export class Referee extends BasePlayer {
  directionQueue: DirectionQueue
  moveSpeed = 125

  isPunching = false
  isWhistling = false

  constructor() {
    super({
      sprite: assets.ase_referee,
      collisionType: ex.CollisionType.Active,
    })

    this.body.mass = 2000

    this.animations.Punch = this.sprite.getAnimation('Punch')!
    this.animations.RedCard = this.sprite.getAnimation('RedCard')!
    this.animations.Whistle = this.sprite.getAnimation('Whistle')!
    this.animations.DropItem = this.sprite.getAnimation('DropItem')!
    this.animations.GiveMoney = this.sprite.getAnimation('GiveMoney')!

    this.on('collisionstart', this.onCollisionStart.bind(this))

    this.animations.Punch.events.on('loop', () => {
      this.isPunching = false
    })

    this.animations.Whistle.events.on('loop', () => {
      this.isWhistling = false
    })
  }

  onInitialize(_engine: Engine): void {
    super.onInitialize(_engine)
    this.pos = ex.vec(
      Math.round(this.scene.field.width / 2) + 38,
      Math.round(this.scene.field.height / 2) - 24
    )

    this.directionQueue = new DirectionQueue(controls)

    this.scene.on('reset', () => {
      this.blowWhistle(false)
    })
  }

  update(engine: Engine, delta: number): void {
    this.directionQueue.update(engine)

    if (engine.input.keyboard.wasPressed(controls.context)) {
      this.punch()
    }

    if (engine.input.keyboard.wasPressed(controls.whistle)) {
      this.blowWhistle()
    }

    if (!this.isPunching && !this.isWhistling) {
      const inputs = this.directionQueue.heldDirections

      const isLeftHeld = inputs.includes('LEFT')
      const isRightHeld = inputs.includes('RIGHT')
      const isUpHeld = inputs.includes('UP')
      const isDownHeld = inputs.includes('DOWN')

      this.vel = ex.vec(
        isRightHeld ? this.moveSpeed : isLeftHeld ? -this.moveSpeed : 0,
        isDownHeld ? this.moveSpeed : isUpHeld ? -this.moveSpeed : 0
      )

      if (this.vel.x !== 0 || this.vel.y !== 0) {
        this.setAnimation('Run')

        if (this.vel.x !== 0) {
          this.currentGraphic().flipHorizontal = this.vel.x < 0
        }
      } else {
        this.setAnimation('Idle')
      }
    }
  }

  onCollisionStart(ev: ex.CollisionStartEvent) {
    if (ev.other instanceof Ball) {
      this.kickBall()
    }
  }

  kickBall() {
    this.scene.ball.kick(
      this.scene.ball.pos.sub(this.pos).normalize().scale(500)
    )
  }

  punch() {
    this.isPunching = true
    this.setAnimation('Punch')
    this.vel = ex.vec(0, 0)

    const [player] = this.scene.entities.filter(
      (entity) =>
        entity !== this &&
        entity instanceof BasePlayer &&
        entity.pos.distance(this.pos) < 20
    ) as BasePlayer[]

    if (player) {
      player.hit(player.pos.sub(this.pos).normalize())
    }
  }

  blowWhistle(reset = true) {
    if (!this.isWhistling) {
      this.isWhistling = true
      this.setAnimation('Whistle')
      this.vel = ex.vec(0, 0)
      assets.snd_whistle.play()

      if (reset) {
        this.scene.reset()
      }
    }
  }
}
