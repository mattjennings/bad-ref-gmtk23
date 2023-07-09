import { Engine } from 'excalibur'
import { BasePlayer } from './base-player'
import { assets } from 'src/assets'
import { DirectionQueue } from 'src/classes/DirectionQueue'
import { Ball } from './ball'
import { TeamPlayer } from './team-player'
import { IcecreamTruck } from './icecream-truck'

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
  moveSpeed = 130

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
      this.setAnimation('Idle')
    })

    this.animations.Whistle.events.on('loop', () => {
      this.setAnimation('Idle')
    })

    this.animations.GiveMoney.events.on('loop', () => {
      this.setAnimation('Idle')
    })

    this.animations.Kick.events.on('loop', () => {
      this.setAnimation('Idle')
    })
  }

  onInitialize(_engine: Engine): void {
    super.onInitialize(_engine)
    this.pos = ex.vec(
      Math.round(this.scene.field.width / 2),
      Math.round(this.scene.field.height / 2) - 64
    )

    this.directionQueue = new DirectionQueue(controls)

    this.scene.on('reset', () => {
      this.blowWhistle(false)
    })
  }

  update(engine: Engine, delta: number): void {
    this.directionQueue.update(engine)

    if (engine.input.keyboard.wasPressed(controls.context)) {
      const icecreamTruck = this.scene.entities.find((entity) => {
        if (entity instanceof IcecreamTruck) {
          return true
        }
      }) as IcecreamTruck | undefined

      const isInfrontOfIcecreamTruck =
        icecreamTruck &&
        this.pos.distance(icecreamTruck.pos) < 45 &&
        this.pos.y > icecreamTruck.pos.y

      if (isInfrontOfIcecreamTruck) {
        if (icecreamTruck.giveIcecream()) {
          this.setAnimation('GiveMoney')
        }
      } else {
        this.punch()
      }
    }

    if (engine.input.keyboard.wasPressed(controls.whistle)) {
      this.blowWhistle()
    }

    if (
      !this.isAnimation('Punch') &&
      !this.isAnimation('Whistle') &&
      !this.isAnimation('GiveMoney')
    ) {
      const inputs = this.directionQueue.heldDirections

      const isLeftHeld = inputs.includes('LEFT')
      const isRightHeld = inputs.includes('RIGHT')
      const isUpHeld = inputs.includes('UP')
      const isDownHeld = inputs.includes('DOWN')

      this.vel = ex.vec(
        isRightHeld ? this.moveSpeed : isLeftHeld ? -this.moveSpeed : 0,
        isDownHeld ? this.moveSpeed : isUpHeld ? -this.moveSpeed : 0
      )

      if (!this.isAnimation('Kick')) {
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
  }

  onCollisionStart(ev: ex.CollisionStartEvent) {
    if (ev.other instanceof Ball) {
      this.kickBall()
    }
  }

  kickBall() {
    if (!this.isAnimation('Whistle') && !this.isAnimation('Punch')) {
      const successful = this.scene.ball.kick(
        this.scene.ball.pos.sub(this.pos).normalize().scale(500)
      )

      if (successful) {
        this.setAnimation('Kick')
      }
    }
  }

  punch() {
    if (!this.isAnimation('Whistle') && !this.isAnimation('Punch')) {
      this.setAnimation('Punch')
      this.vel = ex.vec(0, 0)

      const [player] = this.scene.entities.filter(
        (entity) =>
          entity !== this &&
          entity instanceof BasePlayer &&
          entity.pos.distance(this.pos) < 30
      ) as BasePlayer[]

      if (player) {
        player.scare(player.pos.sub(this.pos).normalize())
      } else {
        assets.snd_dashB.play()
      }
    }
  }

  blowWhistle(reset = true) {
    if (!this.isAnimation('Whistle')) {
      this.setAnimation('Whistle')
      this.vel = ex.vec(0, 0)
      assets.snd_whistle.play()

      if (reset) {
        assets.snd_crowdBLow.play()
        this.scene.reset()
      }
    }
  }
}
