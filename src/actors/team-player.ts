import { Animation, Engine, Vector } from 'excalibur'
import { assets } from 'src/assets'
import MatchScene from 'src/classes/MatchScene'
import { AsepriteResource } from '@excaliburjs/plugin-aseprite'
import { BasePlayer, BasePlayerArgs, Team } from './base-player'

export type TeamPosition = 'defender' | 'midfielder' | 'forward'

const random = new ex.Random()

const sprites = {
  home: [
    assets.ase_character1Blue,
    assets.ase_character2Blue,
    assets.ase_character3Blue,
    assets.ase_character4Blue,
    assets.ase_character5Blue,
    assets.ase_character6Blue,
  ],
  away: [
    assets.ase_character1Red,
    assets.ase_character2Red,
    assets.ase_character3Red,
    assets.ase_character4Red,
    assets.ase_character5Red,
    assets.ase_character6Red,
  ],
}

const positionTemplates = {
  defender: {
    maxStamina: 150,
    moveSpeed: 60,
    power: 1000,
    canLeaveZone: false,
  },
  midfielder: {
    maxStamina: 100,
    moveSpeed: 60,
    power: 700,
  },
  forward: {
    maxStamina: 50,
    moveSpeed: 70,
    power: 800,
  },
}

export interface TeamPlayerArgs extends Omit<BasePlayerArgs, 'sprite'> {
  team: Team
  teamPosition: TeamPosition
  debug?: boolean
}

export class TeamPlayer extends BasePlayer {
  declare scene: MatchScene

  team: Team
  teamPosition: TeamPosition
  moveSpeed: number
  power: number
  maxStamina: number
  stamina: number
  staminaRegenRate: number
  staminaDepletionRate: number

  zones: Record<string, ex.BoundingBox>
  canLeaveZone = true

  debug = false
  isResetting = true
  isSprinting = false
  isPain = false
  isKicking = false

  constructor({ team, teamPosition, debug, ...args }: TeamPlayerArgs) {
    super({
      ...args,
      name: `player_${team}_${teamPosition}`,
      width: 16,
      height: 32,
      collisionType: ex.CollisionType.Passive,
      sprite:
        team === 'home'
          ? random.pickOne(sprites.home)
          : random.pickOne(sprites.away),
    })
    this.team = team
    this.teamPosition = teamPosition
    this.debug = debug ?? false

    Object.assign(this, positionTemplates[teamPosition])
    this.stamina = Math.random() * this.maxStamina
    this.staminaRegenRate = 0.05 * (this.moveSpeed / 100)
    this.staminaDepletionRate = 0.08 * (this.moveSpeed / 100)
  }

  onInitialize(_engine: Engine): void {
    super.onInitialize(_engine)

    this.pos = this.getStartingPosition()

    this.scene.on('postdraw', ({ ctx }) => {
      const toScreenBounds = (bounds: ex.BoundingBox) => {
        const { x: left, y: top } =
          this.scene.engine.screen.worldToScreenCoordinates(
            ex.vec(bounds.left, bounds.top)
          )

        const { x: right, y: bottom } =
          this.scene.engine.screen.worldToScreenCoordinates(
            ex.vec(bounds.right, bounds.bottom)
          )

        return new ex.BoundingBox({
          left,
          top,
          right,
          bottom,
        })
      }

      if (this.debug) {
        const zone = toScreenBounds(this.getPositionZone())

        ctx.drawRectangle(
          ex.vec(zone.left, zone.top),
          zone.width,
          zone.height,
          new ex.Color(255, 0, 0, 0.25)
        )
      }
    })

    this.scene.on('reset', () => {
      this.isResetting = true
      this.isKicking = false
      this.actions.moveTo(this.getStartingPosition(), 300)
    })

    this.scene.on('start', () => {
      this.isResetting = false
    })

    this.animations.Kick.events.on('loop', () => {
      this.isKicking = false
      this.setAnimation('Idle')
    })
  }

  update(engine: Engine, delta: number): void {
    if (this.isPain) {
      this.vel = this.vel.scale(0.9)
      return
    }

    if (!this.isKicking && !this.isResetting) {
      // move towards ball
      const ball = this.scene.ball
      const ballDistance = this.pos.distance(ball.pos)
      const zone = this.getPositionZone()
      const isClosestTeammateToBall = this.scene.entities.reduce(
        (closest, entity) => {
          if (
            entity instanceof TeamPlayer &&
            entity.team === this.team &&
            entity !== this
          ) {
            const teammateDistance = entity.pos.distance(ball.pos)
            const isCloser = teammateDistance <= ballDistance

            if (isCloser) {
              return false
            }
          }

          return closest
        },
        true
      )
      const isBallInZone = zone.contains(ball.pos)

      const chaseBall = () => {
        const speedFactor = this.isSprinting
          ? 1.25
          : this.stamina < this.maxStamina
          ? 0.85
          : 1

        this.moveTo(
          ex.vec(ball.pos.x, ball.pos.y - ball.height / 2),
          this.moveSpeed * speedFactor
        )
        if (ballDistance < 200) {
          this.sprint()
        }
      }

      // move towards ball if far enough
      if (isBallInZone || (this.canLeaveZone && isClosestTeammateToBall)) {
        chaseBall()
      } else {
        // move to edge of zone closes to ball
        const x = ball.pos.x < zone.center.x ? zone.left : zone.right

        const teammateOfSamePosition = this.getTeammateOfSamePosition()

        if (teammateOfSamePosition) {
          const isTop =
            teammateOfSamePosition.pos.y === this.pos.y
              ? teammateOfSamePosition.id < this.id
              : teammateOfSamePosition.pos.y > this.pos.y
          const y = isTop
            ? zone.center.y - zone.center.y / 3
            : zone.center.y + zone.center.y / 3

          this.moveTo(this.getStartingPosition(), this.moveSpeed)
        } else {
          const y = ball.pos.y
          this.moveTo(ex.vec(x, y), this.moveSpeed)
        }
      }

      // kick ball if close enough
      if (ballDistance < 10) {
        if (this.teamPosition === 'defender') {
          this.clearBall()
        } else {
          // kick back out infront of net
          if (this.isBehindOpposingNet()) {
            const center = this.team === 'home' ? -150 : 150

            this.kickBall(
              ex.vec(
                this.getShotPosition().x + center,
                this.getShotPosition().y
              ),
              this.power * 0.5
            )
          }
          // kick ball towards net
          else {
            let power = this.isSprinting ? this.power * 1.5 : this.power

            // if forward and they're far from the net, double the power
            if (this.teamPosition === 'forward') {
              const distanceFromNet = this.pos.distance(this.getShotPosition())

              if (distanceFromNet > 150) {
                power *= 2
              }
            }

            this.kickBall(this.getShotPosition(), power)
          }
        }
      }
    }

    if (this.isSprinting) {
      this.stamina -= this.staminaDepletionRate * delta
    } else {
      this.stamina += this.staminaRegenRate * delta
    }

    if (this.stamina <= 0) {
      this.isSprinting = false
      this.stamina = 0
    } else if (this.stamina >= this.maxStamina) {
      this.stamina = this.maxStamina
    }

    // animation
    if (!this.isKicking) {
      if (this.vel.x !== 0) {
        this.setAnimation('Run')
        this.currentGraphic().flipHorizontal = this.vel.x < 0
      } else {
        this.setAnimation('Idle')

        this.currentGraphic().flipHorizontal =
          this.scene.ball.pos.x < this.pos.x
      }
    }
  }

  getStartingPosition() {
    const zone = this.getPositionZone()
    let pos =
      this.team === 'home'
        ? ex.vec(zone.left + 36 + zone.width / 3, zone.center.y)
        : ex.vec(zone.right + 36 - zone.width / 3, zone.center.y)

    const teammateOfSamePosition = this.getTeammateOfSamePosition()

    if (teammateOfSamePosition) {
      const isTop = teammateOfSamePosition.id < this.id

      if (isTop) {
        pos.y = zone.center.y - zone.center.y / 3
      } else {
        pos.y = zone.center.y + zone.center.y / 3
      }
    }

    return pos
  }

  isBehindOpposingNet() {
    if (this.team === 'home') {
      const net = this.scene.away.net
      return this.pos.x + this.width > net.pos.x
    } else {
      const net = this.scene.home.net
      return this.pos.x - this.width < net.pos.x + net.width
    }
  }

  kickBall(direction: ex.Vector, power = this.power) {
    if (!this.isKicking) {
      const angle = direction.sub(this.scene.ball.pos).toAngle()

      // kick towards net with some random accuracy
      const successful = this.scene.ball.kick(
        ex.vec(power * Math.cos(angle), power * Math.sin(angle))
      )

      if (successful) {
        this.currentGraphic().flipHorizontal = direction.x < 0 ? true : false
        this.isKicking = true
        this.setAnimation('Kick')
        this.vel = ex.vec(0, 0)

        // if defender, stop sprinting after kicking so they dont burn stamina
        // which would give an advantage to the attacker
        if (this.teamPosition === 'defender') {
          this.isSprinting = false
        }
      }
    }
  }

  // if defender, clear ball to area where there are no players
  clearBall() {
    this.kickBall(
      ex.vec(
        this.getShotPosition().x,
        random.pickOne([0, this.scene.field.height])
      )
    )
  }

  sprint() {
    if (this.stamina >= this.maxStamina) {
      this.isSprinting = true
    }
  }

  getShotPosition() {
    const net = this.team === 'home' ? this.scene.away.net : this.scene.home.net

    const netCenter = net.pos.y - net.height / 4
    const goalie =
      this.team === 'home' ? this.scene.away.goalie : this.scene.home.goalie

    // const freeYSpace = this.console.log(freeYSpace)
    return ex.vec(
      net.team === 'home'
        ? net.pos.x - net.width / 4
        : net.pos.x + net.width / 4,
      netCenter
    )
  }

  /**
   * The bounds for the player's position on the field
   */
  getPositionZone() {
    switch (this.teamPosition) {
      case 'defender':
        return this.team === 'home'
          ? this.scene.zones.left
          : this.scene.zones.right
      case 'midfielder':
        return this.scene.zones.mid
      case 'forward':
        return this.team === 'home'
          ? this.scene.zones.right
          : this.scene.zones.left
    }
  }

  getTeammateOfSamePosition() {
    return this.scene.entities.find(
      (entity) =>
        entity instanceof TeamPlayer &&
        entity.team === this.team &&
        entity.teamPosition === this.teamPosition &&
        entity !== this
    ) as TeamPlayer | undefined
  }

  moveTo(pos: Vector, speed: number): void {
    const distance = this.pos.distance(pos)
    const refereeDistance = this.pos.distance(this.scene.referee.pos)

    if (distance > 1) {
      if (refereeDistance < 10) {
        speed *= 0.2
      }
      super.moveTo(pos, speed)
    } else {
      this.vel = ex.vec(0, 0)
    }
  }

  hit(direction: Vector): void {
    super.hit(direction)
    this.isKicking = false
  }
  trip() {
    // this.isPain = true
    // this.isSprinting = false
    // this.stamina = 0
    // this.setAnimation('Trip')
    // // git hit in random direction
    // const angle = random.pickOne([0, Math.PI / 2, Math.PI, (3 * Math.PI) / 2])
    // this.vel = ex.vec(300 * Math.cos(angle), 300 * Math.sin(angle))
  }
}
