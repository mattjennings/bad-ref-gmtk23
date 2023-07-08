export class Sprite extends ex.Actor {
  constructor({ graphics, ...args }: ex.ActorArgs & { graphics: ex.Graphic }) {
    super(args)

    this.graphics.use(graphics)
  }
}
