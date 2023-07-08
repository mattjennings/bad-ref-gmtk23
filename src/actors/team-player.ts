import { Animation, Engine } from 'excalibur'
import { assets } from 'src/assets'
import MatchScene from 'src/classes/MatchScene'
import { AsepriteResource } from '@excaliburjs/plugin-aseprite'

type Team = 'home' | 'away'
type TeamPosition = 'defender' | 'midfielder' | 'forward'

const random = new ex.Random()

const sprites = {
  home: assets.ase_playerRed,
  away: assets.ase_playerBlue,
}

const positionTemplates = {
  defender: {
    maxStamina: 150,
    moveSpeed: 50,
    power: 1000,
    canLeaveZone: false,
  },
  midfielder: {
    maxStamina: 100,
    moveSpeed: 50,
    power: 700,
  },
  forward: {
    maxStamina: 50,
    moveSpeed: 60,
    power: 700,
  },
}

export class TeamPlayer extends ex.Actor {
  declare scene: MatchScene

  team: Team
  teamPosition: TeamPosition
  sprite: AsepriteResource
  animations: Record<string, Animation>
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

  constructor({
    team,
    teamPosition,
    debug,
    ...args
  }: ex.ActorArgs & {
    team: Team
    teamPosition: TeamPosition
    debug?: boolean
  }) {
    super({
      ...args,
      width: 16,
      height: 32,
      collisionType: ex.CollisionType.Passive,
    })
    this.team = team
    this.teamPosition = teamPosition
    this.debug = debug ?? false

    this.sprite = this.team === 'home' ? sprites.home : sprites.away
    this.animations = {
      Idle: this.sprite.getAnimation('Idle')!.clone(),
      Run: this.sprite.getAnimation('Run')!.clone(),
    }
    this.setAnimation('Idle')

    Object.assign(this, positionTemplates[teamPosition])
    this.stamina = this.maxStamina
    this.staminaRegenRate = 0.05 * (this.moveSpeed / 100)
    this.staminaDepletionRate = 0.08 * (this.moveSpeed / 100)
  }

  onInitialize(_engine: Engine): void {
    const zone = this.getPositionZone()

    this.pos =
      this.team === 'home'
        ? ex.vec(zone.left + zone.width / 3, zone.center.y)
        : ex.vec(zone.right - zone.width / 3, zone.center.y)

    const teammateOfSamePosition = this.getTeammateOfSamePosition()

    if (teammateOfSamePosition) {
      teammateOfSamePosition.pos.y = zone.center.y - zone.center.y / 3

      this.pos.y = zone.center.y + zone.center.y / 3
    }

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

    this.addChild(
      new ex.Label({
        text: this.teamPosition,
        color: ex.Color.White,
        x: -20,
        y: 20,
      })
    )
  }

  update(engine: Engine, delta: number): void {
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

    const moveTo = (pos: ex.Vector, speed: number) => {
      const angle = pos.sub(this.pos).toAngle()
      const distance = this.pos.distance(pos)

      if (distance > 1) {
        this.vel = ex.vec(speed * Math.cos(angle), speed * Math.sin(angle))
      } else {
        this.vel = ex.vec(0, 0)
      }
    }

    const chaseBall = () => {
      const speedFactor = this.isSprinting
        ? 1.25
        : this.stamina < this.maxStamina
        ? 0.85
        : 1

      moveTo(ball.pos, this.moveSpeed * speedFactor)
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

        moveTo(ex.vec(x, y), this.moveSpeed)
      } else {
        const y = ball.pos.y
        moveTo(ex.vec(x, y), this.moveSpeed)
      }
    }

    // kick ball if close enough
    if (ballDistance < 10) {
      if (this.teamPosition === 'defender') {
        this.clearBall()
      } else {
        this.kickBall(
          this.getNetPosition(),
          this.isSprinting ? this.power * 1.5 : this.power
        )
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
    }
  }

  kickBall(direction: ex.Vector, power = this.power) {
    // kickBall() gets called every frame, so setting a 10% chance of kicking
    // actually leads to some decent results
    const success = Math.random() > 0.9

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
        this.getNetPosition().x,
        random.pickOne([0, this.scene.field.height])
      )
    )
  }

  sprint() {
    if (this.stamina >= this.maxStamina) {
      this.isSprinting = true
    }
  }

  getNetPosition() {
    return this.team === 'home'
      ? ex.vec(this.scene.field.width - 50, this.scene.field.height / 2)
      : ex.vec(50, this.scene.field.height / 2)
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
  currentGraphic() {
    return this.graphics.current[0]?.graphic
  }

  setAnimation(name: string) {
    const flip = this.currentGraphic()?.flipHorizontal ?? false
    const anim = this.animations[name]

    if (!anim) {
      throw new Error(`Animation ${name} does not exist`)
    }

    this.graphics.use(anim)
    this.currentGraphic().flipHorizontal = flip
  }
}
