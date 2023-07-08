import { assets } from 'src/assets'
import { Ball } from 'src/actors/ball'
import { TeamPlayer } from 'src/actors/team-player'
import { Actor, Engine } from 'excalibur'
import { Sprite } from 'src/actors/sprite'
import { TeamGoalie } from 'src/actors/team-goalie'
import { Net } from 'src/actors/net'

export default class MatchScene extends ex.Scene {
  ball: Ball
  home: {
    players: TeamPlayer[]
    // goalie: TeamGoalie
    net: Net
  }
  away: {
    players: TeamPlayer[]
    net: Net
  }

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
    this.ball = new Ball({
      x: Math.round(this.field.width / 2),
      y: Math.round(this.field.height / 2 - 32),
    })

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
    this.home = {
      net: new Net({ team: 'home' }),
      players: [
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
      ],
    }

    this.away = {
      net: new Net({ team: 'away' }),
      players: [
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
      ],
    }

    Array.from([
      ...this.home.players,
      this.home.net,
      ...this.away.players,
      this.away.net,
    ]).forEach((player, i) => {
      this.engine.add(player)
    })

    // setup camera
    this.camera.strategy.lockToActor(this.ball)
    this.camera.strategy.limitCameraBounds(
      new ex.BoundingBox(0, 0, fieldWidth, fieldHeight)
    )
  }

  onPreUpdate(_engine: Engine, _delta: number): void {
    // ysort all actors
    const sorted = [...this.entities].sort((a, b) => {
      if (a instanceof Actor && b instanceof Actor) {
        return a.pos.y - b.pos.y
      }

      return 0
    })

    // set zindex in order
    sorted.forEach((actor, i) => {
      if (actor instanceof Actor) {
        actor.z = i
      }
    })
  }
}
