import { assets } from 'src/assets'
import { Ball } from 'src/actors/ball'
import { TeamPlayer } from 'src/actors/team-player'
import { Actor } from 'excalibur'
import { Sprite } from 'src/actors/sprite'

export default class MatchScene extends ex.Scene {
  ball: Ball
  homeTeam: TeamPlayer[]
  awayTeam: TeamPlayer[]

  field: Actor

  onInitialize(engine: ex.Engine): void {
    this.ball = new Ball({ x: 8 * 16, y: 1 * 16 })

    // add field
    const { width, height } = assets.img_field.toSprite()
    this.field = new Sprite({
      x: 0,
      y: 0,
      anchor: ex.Vector.Zero,
      z: -100,
      graphics: assets.img_field.toSprite(),
      width,
      height,
    })
    engine.add(this.field)

    // create world bounds
    const fieldHeight = this.field.height
    const fieldWidth = this.field.width
    engine.add(
      new ex.Actor({
        collisionType: ex.CollisionType.Fixed,
        collider: new ex.CompositeCollider([
          new ex.EdgeCollider({
            begin: ex.vec(0, 0),
            end: ex.vec(0, fieldHeight),
          }),
          new ex.EdgeCollider({
            begin: ex.vec(0, fieldHeight),
            end: ex.vec(fieldWidth, fieldHeight),
          }),
          new ex.EdgeCollider({
            begin: ex.vec(fieldWidth, fieldHeight),
            end: ex.vec(fieldWidth, 0),
          }),
          new ex.EdgeCollider({
            begin: ex.vec(fieldWidth, 0),
            end: ex.vec(0, 0),
          }),
        ]),
      })
    )

    // add ball
    engine.add(this.ball)

    // add team
    this.homeTeam = [
      new TeamPlayer({
        team: 'home',
        x: 6 * 16,
        y: 5 * 16,
      }),
      new TeamPlayer({
        team: 'home',
        x: 6 * 16,
        y: 7 * 16,
      }),
    ]

    this.awayTeam = [
      new TeamPlayer({
        team: 'away',
        x: 8 * 16,
        y: 5 * 16,
      }),
      new TeamPlayer({
        team: 'away',
        x: 8 * 16,
        y: 7 * 16,
      }),
    ]
    ;[...this.homeTeam, ...this.awayTeam].forEach((player, i) => {
      this.engine.add(player)
    })

    // setup camera
    this.camera.strategy.lockToActor(this.ball)
    this.camera.strategy.limitCameraBounds(
      new ex.BoundingBox(0, 0, fieldWidth, fieldHeight)
    )
  }
}
