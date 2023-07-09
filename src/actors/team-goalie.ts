import { assets } from 'src/assets'

import { BasePlayer, BasePlayerArgs, Team } from './base-player'
import { Actor, Engine, randomInRange } from 'excalibur'
import { Net } from './net'
import { Ball } from './ball'

const sprites = {
  home: assets.ase_goalieBlue,
  away: assets.ase_goalieRed,
  shadow: assets.img_shadow.toSprite(),
}

const random = new ex.Random()
export interface TeamGoalieArgs extends Omit<BasePlayerArgs, 'sprite'> {
  team: Team
}

export class TeamGoalie extends BasePlayer {
  team: Team
  net: Net

  isKicking = false
  isDistracted = false
  distractedBy: Actor | undefined

  painFrames = 2
  power = 300
  friction = 0.1
  slideDuration = 400
  slideSpeed = 300
  _slideTime = 0

  constructor({ team, ...args }: TeamGoalieArgs) {
    super({
      ...args,
      sprite: sprites[team],
    })

    this.body.mass = 2000
    this.team = team

    this.animations.BlockUp = this.sprite.getAnimation('BlockUp')!
    this.animations.BlockDown = this.sprite.getAnimation('BlockDown')!
    this.animations.HeartEyes = this.sprite.getAnimation('HeartEyes')!
  }

  onInitialize(_engine: Engine): void {
    super.onInitialize(_engine)
    this.net = this.scene[this.team].net
    this.pos = ex.vec(this.getLineX(), this.net.pos.y - this.height)
    this.on('collisionstart', this.onCollisionStart)

    this.animations.Kick.events.on('loop', () => {
      this.isKicking = false
    })
  }

  onCollisionStart(ev: ex.CollisionStartEvent) {
    if (ev.other instanceof Ball) {
      const ball = ev.other as Ball

      ball.vel.x *= -1
      ball.vel.y *= -1
    }
  }

  getLineX() {
    const top = this.net.pos.y - this.net.height / 2

    if (this.team === 'home') {
      const modifiedX = (top - this.pos.y) / 5

      return this.net.pos.x + this.net.width + 16 + modifiedX
    } else {
      const modifiedX = (this.pos.y - top) / 5

      return this.net.pos.x - 16 + modifiedX
    }
  }

  isSliding() {
    return this._slideTime > 0
  }

  update(engine: Engine, delta: number): void {
    if (this.isPain) {
      this.vel = this.vel.scale(0.9)
      return
    }

    if (this.isKicking) {
      return
    }

    if (this.isDistracted && this.distractedBy) {
      const distance = this.pos.distance(this.distractedBy.pos)

      if (distance > 10) {
        this.moveTo(this.distractedBy.pos, 100)
      } else {
        this.vel = ex.vec(0, 0)
      }

      if (this.vel.x !== 0 || this.vel.y !== 0) {
        this.setAnimation('Run')
      } else {
        this.setAnimation('HeartEyes')
      }
      return
    }

    const { top: netTop, bottom: netBottom } = this.getGoalBounds()

    const goalieTop = this.pos.y
    const goalieBottom = this.pos.y + this.height
    const ball = this.scene.ball
    const distanceToBall = ball.pos.distance(this.pos)

    const target = ex.vec(
      this.getLineX(),
      ex.clamp(ball.pos.y, netTop + 16, netBottom - 8)
    )

    const shouldMoveUp =
      ball.pos.y < goalieTop && Math.abs(goalieTop - target.y) > 5
    const shouldMoveDown =
      ball.pos.y > goalieBottom && Math.abs(target.y - goalieBottom) > 5

    if (this.shouldSlide()) {
      this.slide(this.pos.y < ball.pos.y ? 'down' : 'up')
    } else if (!this.isSliding()) {
      if (!this.isLinedUpWithBall() && (shouldMoveUp || shouldMoveDown)) {
        this.moveTo(target, 50)
      } else {
        this.vel = ex.vec(0, 0)
      }

      if (this.vel.y !== 0) {
        this.setAnimation('Run')
      } else {
        this.setAnimation('Idle')
      }
    }

    if (
      distanceToBall < 30 &&
      Math.abs(ball.vel.x) < 100 &&
      Math.abs(ball.vel.y) < 100
    ) {
      this.kickBall()
    }

    this.currentGraphic().flipHorizontal = this.team === 'away'

    if (this._slideTime > 0) {
      this.vel = this.vel.scale(1 - this.friction)
      this._slideTime -= delta

      if (this._slideTime < 0) {
        this._slideTime = 0
      }
    }
  }

  isLinedUpWithBall() {
    const middle = this.pos.y + this.height / 2 + 10
    return Math.abs(middle - this.scene.ball.pos.y) < 5
  }

  isInNet() {
    const { top, bottom } = this.getGoalBounds()

    return this.pos.y > top && this.pos.y < bottom
  }

  getGoalBounds() {
    return {
      top: this.net.pos.y - this.net.height / 2,
      bottom: this.net.pos.y,
    }
  }

  kickBall() {
    const success = this.scene.ball.kick(
      ex.vec(
        this.team === 'home' ? this.power : -this.power,
        random.pickOne([-this.power, this.power])
      )
    )

    if (success) {
      this.setAnimation('Kick')
      this.isKicking = true
    }
  }

  shouldSlide() {
    const ball = this.scene.ball
    const xDistanceToBall = Math.abs(
      this.pos.x - (this.team === 'home' ? ball.pos.x : ball.pos.x + ball.width)
    )
    const yDistanceToBall = Math.abs(this.pos.y - ball.pos.y)

    const ballIsMoving = Math.abs(ball.vel.x) > 100
    const isMovingTowardsGoal =
      this.team === 'home' ? ball.vel.x < 0 : ball.vel.x > 0
    // const ballIsGoingIntoNet =

    return (
      this.isInNet() &&
      ballIsMoving &&
      isMovingTowardsGoal &&
      yDistanceToBall > 20 &&
      xDistanceToBall > 5 &&
      xDistanceToBall < 30 &&
      !this.isLinedUpWithBall()
    )
  }

  slide(direction: 'up' | 'down') {
    if (!this.isSliding()) {
      this._slideTime = this.slideDuration
      this.setAnimation(direction === 'up' ? 'BlockUp' : 'BlockDown')
      this.vel.y = direction === 'up' ? -this.slideSpeed : this.slideSpeed
    }
  }

  distract(actor: Actor, duration: number) {
    this.isDistracted = true
    this.isKicking = false
    this.isPain = false
    this._slideTime = 0
    this.distractedBy = actor
    this.body.collisionType = ex.CollisionType.Passive

    const undistract = () => {
      this.isDistracted = false
      this.distractedBy = undefined
      this.body.collisionType = ex.CollisionType.Active
    }
    actor.once('kill', (ev: ex.KillEvent) => {
      if (actor === ev.other) {
        undistract()
      }
    })
    this.actions
      .delay(duration)
      .toPromise()
      .then(() => {
        if (actor === this.distractedBy) {
          undistract()
        }
      })
  }
}
