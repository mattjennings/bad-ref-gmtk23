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

  zones: Record<
    'left' | 'mid' | 'right' | 'leftCrease' | 'rightCrease',
    ex.BoundingBox
  >

  onInitialize(engine: ex.Engine): void {
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

    this.zones = {
      left: new ex.BoundingBox(0, 0, this.field.width / 3, this.field.height),
      leftCrease: new ex.BoundingBox(
        0,
        0,
        this.field.width / 8,
        this.field.height
      ),
      mid: new ex.BoundingBox(
        this.field.width / 3,
        0,
        (this.field.width * 2) / 3,
        this.field.height
      ),
      right: new ex.BoundingBox(
        (this.field.width * 2) / 3,
        0,
        this.field.width,
        this.field.height
      ),
      rightCrease: new ex.BoundingBox(
        (this.field.width * 7) / 8,
        0,
        this.field.width,
        this.field.height
      ),
    }
    this.ball = new Ball({ x: this.field.width / 2, y: this.field.height / 2 })

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
        teamPosition: 'forward',
      }),
      new TeamPlayer({
        team: 'home',
        teamPosition: 'midfielder',
      }),
      new TeamPlayer({
        team: 'home',
        teamPosition: 'defender',
      }),
      new TeamPlayer({
        team: 'home',
        teamPosition: 'defender',
      }),
    ]

    this.awayTeam = [
      new TeamPlayer({
        team: 'away',
        teamPosition: 'forward',
      }),
      new TeamPlayer({
        team: 'away',
        teamPosition: 'midfielder',
      }),
      new TeamPlayer({
        team: 'away',
        teamPosition: 'defender',
      }),
      new TeamPlayer({
        team: 'away',
        teamPosition: 'defender',
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
