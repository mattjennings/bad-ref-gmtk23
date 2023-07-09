import { ActorArgs, Canvas, Engine } from 'excalibur'
import { assets } from 'src/assets'

export class Ball extends ex.Actor {
  gravity = 0.1
  maxVelocity = 500

  // can only be kicked once per this many milliseconds
  kickThrottleMax = 500
  kickThrottle = 0

  friction = 0.05

  constructor(args: ActorArgs) {
    super({
      ...args,
      name: 'ball',
      anchor: ex.vec(0.5, 0.5),
      radius: 8,
      collisionType: ex.CollisionType.Active,
      rotation: 0,
    })
    this.body.bounciness = 0.5

    // prevent ball from auto rotating from physics
    this.body.limitDegreeOfFreedom.push(ex.DegreeOfFreedom.Rotation)
  }

  onInitialize(_engine: Engine): void {
    const shadowSprite = assets.img_shadow.toSprite()
    shadowSprite.scale = ex.vec(0.75, 0.75)

    this.graphics.onPreDraw = (ctx) => {
      shadowSprite.draw(ctx, -12, -16)
    }

    _engine.input.keyboard.on('press', (ev) => {
      const power = 200
      if (ev.key === ex.Input.Keys.Left) {
        this.kick(ex.Vector.Left.scale(power), true)
      } else if (ev.key === ex.Input.Keys.Right) {
        this.kick(ex.Vector.Right.scale(power), true)
      } else if (ev.key === ex.Input.Keys.Up) {
        this.kick(ex.Vector.Up.scale(power), true)
      } else if (ev.key === ex.Input.Keys.Down) {
        this.kick(ex.Vector.Down.scale(power), true)
      }
    })

    // _engine.input.pointers.on('down', (ev) => {
    //   this.pos = ev.worldPos
    //   console.log('moved to', this.pos)
    // })
  }

  /**
   * Kicks the ball. There is a throttle to prevent kicking too often,
   * but it can be overridden by passing force=true
   */
  kick(vel: ex.Vector, force = false) {
    if (force || this.kickThrottle === 0) {
      this.kickThrottle = this.kickThrottleMax
      // scale down y velocity to account for perspective
      vel.y *= 0.6

      this.vel = this.vel.add(vel)
    }
  }

  update(engine: Engine, delta: number): void {
    super.update(engine, delta)

    this.vel = this.vel.scale(1 - this.friction)

    if (Math.abs(this.vel.x) > this.maxVelocity) {
      this.vel.x = this.maxVelocity * Math.sign(this.vel.x)
    }

    if (Math.abs(this.vel.y) > this.maxVelocity) {
      this.vel.y = this.maxVelocity * Math.sign(this.vel.y)
    }

    this.kickThrottle -= delta

    if (this.kickThrottle < 0) {
      this.kickThrottle = 0
    }

    this.updateAnimation()
  }

  updateAnimation() {
    const isHorizontal = Math.abs(this.vel.x) > Math.abs(this.vel.y)
    const isMoving =
      Math.round(this.vel.x) !== 0 || Math.round(this.vel.y) !== 0

    const xDir = Math.sign(this.vel.x)
    const yDir = Math.sign(this.vel.y)

    let anim = isHorizontal
      ? assets.ase_ballHorizontal.getAnimation(
          xDir >= 0 ? 'RollRight' : 'RollLeft'
        )!
      : assets.ase_ballVertical.getAnimation(yDir >= 0 ? 'RollDown' : 'RollUp')!

    this.graphics.use(anim)

    if (!isMoving) {
      anim.pause()
    } else {
      anim.timeScale = isHorizontal
        ? Math.abs(this.vel.x) / 100
        : Math.abs(this.vel.y) / 100
      anim.play()
    }
  }
}
