import { Animation, Engine, Vector } from 'excalibur'
import { assets } from 'src/assets'
import MatchScene from 'src/classes/MatchScene'
import { AsepriteResource } from '@excaliburjs/plugin-aseprite'
import { BasePlayer, BasePlayerArgs } from './base-player'

export type Team = 'home' | 'away'
export type TeamPosition = 'defender' | 'midfielder' | 'forward'

const random = new ex.Random()

const sprites = {
  home: [assets.ase_character1Blue, assets.ase_character2Blue],
  away: [assets.ase_character1Red, assets.ase_character2Red],
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
    power: 3000,
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
  isSprinting = false

  debug = false
  isResetting = true

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
      this.actions.moveTo(this.getStartingPosition(), 300)
    })

    this.scene.on('start', () => {
      this.isResetting = false
    })
  }

  update(engine: Engine, delta: number): void {
    if (!this.isResetting) {
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

          this.moveTo(ex.vec(x, y), this.moveSpeed)
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
            this.kickBall(
              this.getShotPosition(),
              this.isSprinting ? this.power * 1.5 : this.power
            )
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
    if (this.vel.x !== 0) {
      this.setAnimation('Run')
      this.currentGraphic().flipHorizontal = this.vel.x < 0
    } else {
      this.setAnimation('Idle')

      this.currentGraphic().flipHorizontal = this.scene.ball.pos.x < this.pos.x
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
    // kickBall() gets called every frame, so setting a 10% chance of kicking
    // actually leads to some decent results
    const success = true // Math.random() > 0.9

    const magnitude = (vec: ex.Vector) =>
      Math.sqrt(Math.pow(vec.x, 2) + Math.pow(vec.y, 2))

    // if ball is moving too fast, don't kick it
    if (magnitude(this.scene.ball.vel) > 50) {
      return
    }

    if (success) {
      const angle = direction.sub(this.scene.ball.pos).toAngle()

      // kick towards net with some random accuracy
      this.scene.ball.kick(
        ex.vec(power * Math.cos(angle), power * Math.sin(angle))
      )

      // if defender, stop sprinting after kicking so they dont burn stamina
      // which would give an advantage to the attacker
      if (this.teamPosition === 'defender') {
        this.isSprinting = false
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

    if (distance > 1) {
      super.moveTo(pos, speed)
    } else {
      this.vel = ex.vec(0, 0)
    }
  }
}
