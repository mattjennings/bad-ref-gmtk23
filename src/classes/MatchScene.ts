import { assets } from 'src/assets'
import { Ball } from 'src/actors/ball'
import { TeamPlayer } from 'src/actors/team-player'
import { Actor, Engine, ScreenElement } from 'excalibur'
import { Sprite } from 'src/actors/sprite'
import { TeamGoalie } from 'src/actors/team-goalie'
import { Net } from 'src/actors/net'
import { Referee } from 'src/actors/referee'
import { Team } from 'src/actors/base-player'
import { HudInstructions } from '../hud/hud-instructions'
import { Scoreboard } from '../hud/scoreboard'
import { IcecreamTruck } from 'src/actors/icecream-truck'
import { MessageBox } from 'src/hud/message-box'

export const SCORE_TO_WIN = 5
export default class MatchScene extends ex.Scene {
  ball: Ball
  home: {
    players: TeamPlayer[]
    goalie: TeamGoalie
    net: Net
    score: number
  }
  away: {
    players: TeamPlayer[]
    goalie: TeamGoalie
    net: Net
    score: number
  }

  lastPosession?: Team
  referee: Referee

  gameHasStarted = false
  gameOver = false

  field: ex.BoundingBox
  zones: Record<'left' | 'mid' | 'right', ex.BoundingBox>

  onInitialize(engine: ex.Engine): void {
    // add field
    const fieldSprite = assets.img_field.toSprite()

    engine.add(
      new Sprite({
        name: 'field_image',
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

    this.field = worldBounds

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
      x: Math.round(this.field.width / 2),
      y: Math.round(this.field.height / 2) - 36,
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
      score: 0,
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
      score: 0,
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

    this.referee = new Referee()

    engine.add(this.referee)

    Array.from([
      ...this.home.players,
      ...this.away.players,
      // this.home.players[2],
      this.home.net,
      this.away.net,
      this.home.goalie,
      this.away.goalie,
    ]).forEach((player, i) => {
      this.engine.add(player)
    })

    // add HUD
    engine.add(new HudInstructions())
    engine.add(new Scoreboard())
    engine.add(
      new MessageBox(
        'You are a referee. Team Blue paid you to\nhelp them win. Do whatever it takes.\n\nPress Enter to start the game.'
      )
    )

    // setup camera
    this.camera.strategy.lockToActor(this.referee)
    this.camera.strategy.limitCameraBounds(
      new ex.BoundingBox(0, 0, worldBounds.right, worldBounds.bottom)
    )

    this.add(new IcecreamTruck())
    this.on('goal', this.onGoal.bind(this))
    assets.snd_crowdA.play()
  }

  onGoal({ team }: { team: Team }) {
    this[team].score++

    assets.snd_crowdA.play()
    assets.snd_crowdBHigh.play()
    assets.snd_crowdBLow.play()

    if (this.home.score >= SCORE_TO_WIN) {
      this.gameHasStarted = false
      this.gameOver = true
      this.engine.add(
        new MessageBox('Team Blue wins!\n\nPress Enter to play again.')
      )
    } else if (this.away.score >= SCORE_TO_WIN) {
      this.gameHasStarted = false
      this.gameOver = true
      this.engine.add(new MessageBox('You lose.\n\nPress Enter to play again.'))
    }

    this.reset()
  }

  start() {
    if (this.gameOver) {
      this.gameOver = false
      this.gameHasStarted = true
      this.home.score = 0
      this.away.score = 0
    }
    this.emit('start', {})
  }

  reset() {
    this.emit('reset', {})

    const posession = this.lastPosession
      ? this.lastPosession === 'home'
        ? -16
        : 16
      : 0

    this.ball.actions
      .moveTo(
        ex.vec(
          Math.round(this.field.width / 2) + posession,
          Math.round(this.field.height / 2) - 36
        ),
        500
      )
      .toPromise()
      .then(() => {
        if (this.gameHasStarted) {
          this.start()
        }
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
      if (actor.name === 'field_image' || actor instanceof ScreenElement) {
        return
      }
      if (actor instanceof Actor) {
        actor.z = i - 100
      }
    })
  }
}
