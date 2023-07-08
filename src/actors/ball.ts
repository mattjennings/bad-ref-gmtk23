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
      radius: 8,
      collisionType: ex.CollisionType.Active,
    })
    this.body.bounciness = 0.5

    // prevent ball from auto rotating from physics
    this.body.limitDegreeOfFreedom.push(ex.DegreeOfFreedom.Rotation)
  }

  onInitialize(_engine: Engine): void {
    this.graphics.use(assets.img_ball.toSprite())

    const shadowSprite = assets.img_ballShadow.toSprite()

    this.graphics.onPreDraw = (ctx) => {
      // prevent sprite being drawn at same rotation as ball
      ctx.rotate(-this.rotation)
      shadowSprite.draw(ctx, -8, -6)
      ctx.rotate(this.rotation)
    }

    _engine.input.keyboard.on('press', (ev) => {
      const power = 500
      if (ev.key === ex.Input.Keys.Left) {
        this.kick(ex.Vector.Left.scale(power))
      } else if (ev.key === ex.Input.Keys.Right) {
        this.kick(ex.Vector.Right.scale(power))
      } else if (ev.key === ex.Input.Keys.Up) {
        this.kick(ex.Vector.Up.scale(power))
      } else if (ev.key === ex.Input.Keys.Down) {
        this.kick(ex.Vector.Down.scale(power))
      }
    })
  }

  kick(vel: ex.Vector) {
    if (this.kickThrottle === 0) {
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

    this.scale.setTo(1 - this.z / 100, 1 - this.z / 100)
    if (this.z > 0) {
      this.z -= 0.1 * delta
    } else {
      this.z = 0
    }

    const distance = this.pos.distance(ex.vec(0, 0)) / 10
    this.rotation = distance % 360

    this.kickThrottle -= delta

    if (this.kickThrottle < 0) {
      this.kickThrottle = 0
    }
  }

  onPreUpdate(_engine: Engine, _delta: number): void {
    // this.pos.y -= this.z
  }

  onPostUpdate(_engine: Engine, _delta: number): void {
    // this.pos.y += this.z
  }
}
