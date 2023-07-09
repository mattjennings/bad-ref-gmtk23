import { Engine, ScreenElement } from 'excalibur'
import { assets } from '../assets'
import MatchScene from 'src/classes/MatchScene'

class ScoreboardNumber extends ScreenElement {
  team: string
  declare scene: MatchScene

  constructor({ x = 0, y = 0, team = 'home' }) {
    super({
      x,
      y,
    })
    this.team = team
    this.graphics.use(assets.ase_scoreNumbers.getAnimation(String(0))!)
  }

  updateScore() {
    this.graphics.use(
      assets.ase_scoreNumbers.getAnimation(String(this.scene[this.team].score))!
    )
  }
  onInitialize() {
    this.scene.on('goal', (event: any) => {
      if (event.team === this.team) {
        this.updateScore()
      }
    })

    this.scene.on('start', () => {
      this.updateScore()
    })
  }
}

class ScoreboardTeamBadge extends ScreenElement {
  constructor({ x = 0, y = 0, team = 'home' }) {
    super({
      x,
      y,
    })
    this.graphics.use(
      team === 'home'
        ? assets.img_blueTeamBadge.toSprite()
        : assets.img_redTeamBadge.toSprite()
    )
  }
}

export class Scoreboard extends ScreenElement {
  constructor() {
    super({
      x: 0,
      y: 0,
    })
  }

  onInitialize(engine: Engine): void {
    const homeScoreNumber = new ScoreboardNumber({ x: 0, y: 0, team: 'home' })
    engine.add(homeScoreNumber)
    const homeBadge = new ScoreboardTeamBadge({ x: 36, y: 6, team: 'home' })
    engine.add(homeBadge)

    const awayScoreNumber = new ScoreboardNumber({ x: 270, y: 0, team: 'away' })
    engine.add(awayScoreNumber)
    const awayBadge = new ScoreboardTeamBadge({ x: 268, y: 6, team: 'away' })
    engine.add(awayBadge)
  }
}
