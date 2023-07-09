import { ScreenElement } from 'excalibur'
import { assets } from '../assets'

export class HudInstructions extends ScreenElement {
  constructor() {
    super({
      x: 4,
      y: 180,
    })
    this.graphics.use(assets.img_hudInstructions.toSprite())
  }
}
