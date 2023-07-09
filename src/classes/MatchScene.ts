import { assets } from 'src/assets'
import { Ball } from 'src/actors/ball'
import { Team, TeamPlayer } from 'src/actors/team-player'
import { Actor, Engine } from 'excalibur'
import { Sprite } from 'src/actors/sprite'
import { TeamGoalie } from 'src/actors/team-goalie'
import { Net } from 'src/actors/net'

export default class MatchScene extends ex.Scene {
  ball: Ball
  home: {
    players: TeamPlayer[]
    goalie: TeamGoalie
    // goalie: TeamGoalie
    net: Net
  }
  away: {
    players: TeamPlayer[]
    goalie: TeamGoalie
    net: Net
  }

  field: ex.BoundingBox
  zones: Record<'left' | 'mid' | 'right', ex.BoundingBox>

  onInitialize(engine: ex.Engine): void {
    // add field
    const fieldSprite = assets.img_field.toSprite()

    engine.add(
      new Sprite({
        x: 0,
        y: 0,
        anchor: ex.Vector.Zero,
        z: -100,
        graphics: assets.img_field.toSprite(),
        width: fieldSprite.width,
        height: fieldSprite.height,
      })
    )
    const worldBounds = new ex.BoundingBox({
      left: 0,
      right: fieldSprite.width,
      top: 0,
      bottom: fieldSprite.height,
    })

    // the real bounds of the field
    this.field = new ex.BoundingBox({
      left: 38,
      right: 825,
      top: 24,
      bottom: 323,
    })

    this.zones = {
      left: new ex.BoundingBox(0, 0, this.field.width / 3, this.field.height),
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
    }
    this.ball = new Ball({
      x: Math.round(this.field.width / 2) + 38,
      y: Math.round(this.field.height / 2) + 8,
    })

    engine.add(
      new ex.Actor({
        collisionType: ex.CollisionType.Fixed,
        collider: new ex.CompositeCollider([
          // left
          new ex.EdgeCollider({
            begin: ex.vec(16, 0),
            end: ex.vec(16, worldBounds.bottom),
          }),

          // bottom
          new ex.EdgeCollider({
            begin: ex.vec(16, worldBounds.bottom),
            end: ex.vec(worldBounds.width - 16, worldBounds.height),
          }),

          // right
          new ex.EdgeCollider({
            begin: ex.vec(worldBounds.width - 16, worldBounds.height),
            end: ex.vec(worldBounds.width - 16, 0),
          }),
          // top
          new ex.EdgeCollider({
            begin: ex.vec(worldBounds.width - 16, 0),
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
      goalie: new TeamGoalie({ team: 'home' }),
      players: [
        new TeamPlayer({
          team: 'home',
          teamPosition: 'forward',
        }),
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
      goalie: new TeamGoalie({ team: 'away' }),
      players: [
        new TeamPlayer({
          team: 'away',
          teamPosition: 'forward',
        }),
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
      ...this.away.players,
      this.home.net,
      this.away.net,
      this.home.goalie,
      this.away.goalie,
    ]).forEach((player, i) => {
      this.engine.add(player)
    })

    // setup camera
    this.camera.strategy.lockToActor(this.ball)
    this.camera.strategy.limitCameraBounds(
      new ex.BoundingBox(0, 0, worldBounds.right, worldBounds.bottom)
    )

    this.on('goal', this.onGoal.bind(this))
    setTimeout(() => this.emit('start', {}))
  }

  onGoal({ team }: { team: Team }) {
    const posession = team === 'home' ? 'away' : 'home'
    this.emit('reset', { posession })

    this.ball.actions
      .moveTo(
        ex.vec(
          Math.round(this.field.width / 2) +
            38 +
            (posession === 'home' ? -16 : 16),
          Math.round(this.field.height / 2) + 8
        ),
        300
      )
      .toPromise()
      .then(() => {
        this.emit('start', {})
      })
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
