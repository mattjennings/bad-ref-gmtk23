import { Engine, ScreenElement } from 'excalibur'
import { assets } from '../assets'

class ScoreboardNumber extends ScreenElement {
  constructor({ x = 0, y = 0 }) {
    super({
      x,
      y,
    })
    this.graphics.use(assets.ase_scoreNumbers.getAnimation('0'))
  }
}

class ScoreboardTeamBadge extends ScreenElement {
  constructor({ x = 0, y = 0, team }) {
    super({
      x,
      y,
    })
    this.graphics.use(
      team === 'blue'
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
    const homeScoreNumber = new ScoreboardNumber({ x: 0, y: 0 })
    engine.add(homeScoreNumber)
    const homeBadge = new ScoreboardTeamBadge({ x: 36, y: 6, team: 'blue' })
    engine.add(homeBadge)

    const awayScoreNumber = new ScoreboardNumber({ x: 270, y: 0 })
    engine.add(awayScoreNumber)
    const awayBadge = new ScoreboardTeamBadge({ x: 268, y: 6, team: 'red' })
    engine.add(awayBadge)
  }
}
