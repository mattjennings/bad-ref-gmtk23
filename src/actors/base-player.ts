import { Animation, Engine } from 'excalibur'
import { assets } from 'src/assets'
import MatchScene from 'src/classes/MatchScene'
import { AsepriteResource } from '@excaliburjs/plugin-aseprite'

const sprites = {
  shadow: assets.img_shadow.toSprite(),
}

export type BasePlayerArgs = ex.ActorArgs & {
  sprite: AsepriteResource
  debug?: boolean
}

export class BasePlayer extends ex.Actor {
  declare scene: MatchScene

  sprite: AsepriteResource
  animations: Record<string, Animation>

  isSprinting = false
  debug = false

  constructor({ sprite, debug, ...args }: BasePlayerArgs) {
    super({
      ...args,
      width: 16,
      height: 12,
      collisionType: ex.CollisionType.Passive,
      collider: ex.Shape.Box(16, 12, ex.vec(0.5, 1), ex.vec(0, 12)),
    })
    this.debug = debug ?? false
    this.sprite = sprite
    this.animations = {
      Idle: this.sprite.getAnimation('Idle')!.clone(),
      Run: this.sprite.getAnimation('Run')!.clone(),
      Pain: this.sprite.getAnimation('Pain')!.clone(),
      Kick: this.sprite.getAnimation('Kick')!.clone(),
      Slide: this.sprite.getAnimation('Slide')!.clone(),
    }
    this.setAnimation('Idle')
  }

  onInitialize(_engine: Engine): void {
    // draw shadow
    this.graphics.onPreDraw = (ctx) => {
      sprites.shadow.draw(ctx, -16, -16)
    }
  }

  currentGraphic() {
    return this.graphics.current[0]?.graphic
  }

  setAnimation(name: string) {
    const flip = this.currentGraphic()?.flipHorizontal ?? false
    const anim = this.animations[name]

    if (!anim) {
      throw new Error(`Animation ${name} does not exist`)
    }

    this.graphics.use(anim)
    this.currentGraphic().flipHorizontal = flip
  }

  moveTo(pos: ex.Vector, speed: number) {
    const angle = pos.sub(this.pos).toAngle()

    this.vel = ex.vec(speed * Math.cos(angle), speed * Math.sin(angle))
  }
}
