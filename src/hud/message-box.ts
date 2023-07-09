import { Engine, ScreenElement, SpriteFont, SpriteSheet } from 'excalibur'
import { assets } from '../assets'

const whiteFont = new SpriteFont({
  alphabet: '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ,!\'&."?-()+ ',
  caseInsensitive: true,
  spriteSheet: SpriteSheet.fromImageSource({
    image: assets.img_fontWhite,
    grid: {
      rows: 3,
      columns: 16,
      spriteWidth: 16,
      spriteHeight: 16,
    },
  }),
  spacing: -6,
})

export class MessageBox extends ScreenElement {
  constructor(public message: string) {
    super({
      x: 0,
      y: 142,
      z: 99999,
    })
  }

  onInitialize(_engine: Engine): void {
    const text = new ex.Text({
      text: this.message,
      font: whiteFont,
      scale: ex.vec(0.75, 0.75),
    })

    const bg = new ex.Rectangle({
      width: this.scene.camera.viewport.width,
      height: this.scene.camera.viewport.height - this.pos.y,
      color: ex.Color.Black,
    })

    this.graphics.use(
      new ex.GraphicsGroup({
        members: [
          {
            graphic: bg,
            pos: ex.vec(0, 0),
          },
          {
            graphic: text,
            pos: ex.vec(4, 4),
          },
        ],
      })
    )

    this.scene.on('start', () => {
      this.kill()
    })
  }
}
