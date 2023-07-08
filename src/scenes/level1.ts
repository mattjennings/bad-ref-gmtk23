import { assets } from 'src/assets'
import { Player } from 'src/actors/player'
import { Ball } from 'src/actors/ball'

export default class Level1 extends ex.Scene {
  onInitialize(engine: ex.Engine): void {
    const map = new ex.Actor({
      anchor: ex.Vector.Zero,
      z: -100,
    })
    map.graphics.use(assets.img_field.toSprite())

    const ball = new Ball({ x: 8 * 16, y: 8 * 16 })

    engine.add(map)
    engine.add(ball)

    const fieldHeight = assets.img_field.height
    const fieldWidth = assets.img_field.width
    // create world bounds
    engine.add(
      // new ex.Actor({
      //   x: 0,
      //   y: 0,
      //   height: 100,
      //   width: 800,
      //   anchor: ex.vec(0, 1),
      //   collisionType: ex.CollisionType.Fixed,
      // })
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

    this.camera.strategy.lockToActor(ball)
    this.camera.strategy.limitCameraBounds(
      new ex.BoundingBox(0, 0, fieldWidth, fieldHeight)
    )
  }
}
