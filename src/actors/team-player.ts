import { Animation, Engine } from 'excalibur'
import { assets } from 'src/assets'
import MatchScene from 'src/classes/MatchScene'

type Team = 'home' | 'away'

const random = new ex.Random()

const sprites = {
  home: assets.ase_playerRed,
  away: assets.ase_playerBlue,
}
export class TeamPlayer extends ex.Actor {
  declare scene: MatchScene
  team: Team

  moveSpeed = random.pickOne([40, 50, 60])

  maxStamina = 100
  stamina = 100

  staminaRegenRate = 0.02 * (this.moveSpeed / 100)
  staminaDepletionRate = 0.05 * (this.moveSpeed / 100)

  isSprinting = false

  constructor({
    team,
    ...args
  }: ex.ActorArgs & {
    team: Team
  }) {
    super({
      ...args,
      width: 16,
      height: 32,
      // color: team === 'home' ? ex.Color.Blue : ex.Color.Red,
      collisionType: ex.CollisionType.Passive,
    })
    this.team = team
    const sprite = this.team === 'home' ? sprites.home : sprites.away

    this.graphics.use(sprite.getAnimation('Run')!)
  }

  onInitialize(_engine: Engine): void {}

  update(engine: Engine, delta: number): void {
    // move towards ball
    const ball = this.scene.ball
    const ballPos = ball.pos
    const ballDistance = ballPos.distance(this.pos)

    if (ballDistance > 10) {
      const angle = ballPos.sub(this.pos).toAngle()
      const speedFactor = this.isSprinting
        ? 1.5
        : this.stamina < this.maxStamina
        ? 0.8
        : 1
      const speed = this.moveSpeed * speedFactor
      this.vel = ex.vec(speed * Math.cos(angle), speed * Math.sin(angle))

      if (ballDistance < 200) {
        this.sprint()
      }
    }

    // kick ball if close enough
    if (ballDistance < 10) {
      this.kickBall()
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

    this.currentGraphic().flipHorizontal = this.vel.x < 0
  }

  kickBall() {
    const angle = this.getNetPosition().sub(this.scene.ball.pos).toAngle()

    // kick towards net with some random accuracy
    this.scene.ball.kick(
      ex.vec(
        ex.randomInRange(200, 400) * Math.cos(angle),
        ex.randomInRange(100, 200) * Math.sin(angle)
      )
    )
    // this.scene.ball.kick(
    //   ex.vec(
    //     ex.randomInRange(100, 200) * this.getNetPosition().x,
    //     ex.randomInRange(-100, 100)
    //   )
    // )
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

  currentGraphic() {
    return this.graphics.current[0].graphic
  }
}
