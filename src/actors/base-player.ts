import { Animation, Engine } from 'excalibur'
import { assets } from 'src/assets'
import MatchScene from 'src/classes/MatchScene'
import { AsepriteResource } from '@excaliburjs/plugin-aseprite'
import { Ball } from './ball'

const sprites = {
  shadow: assets.img_shadow.toSprite(),
}

export type Team = 'home' | 'away'

export type BasePlayerArgs = ex.ActorArgs & {
  team?: Team
  sprite: AsepriteResource
  debug?: boolean
}

export class BasePlayer extends ex.Actor {
  declare scene: MatchScene

  team?: Team
  sprite: AsepriteResource
  animations: Record<string, Animation>

  isPain = false
  painFrames = 5
  isSprinting = false
  debug = false

  constructor({ sprite, debug, team, ...args }: BasePlayerArgs) {
    super({
      width: 16,
      height: 16,
      collisionType: ex.CollisionType.Active,
      ...args,
    })
    this.team = team
    this.body.limitDegreeOfFreedom.push(ex.DegreeOfFreedom.Rotation)
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

    let isPainCount = 0
    this.animations.Pain.events.on('loop', (a) => {
      isPainCount++

      if (isPainCount > this.painFrames) {
        this.isPain = false
        isPainCount = 0
      }
    })

    // set last posession
    this.on('collisionstart', (ev) => {
      if (ev.other instanceof Ball) {
        if (this.team) {
          this.scene.lastPosession = this.team
        }
      }
    })
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

  isAnimation(name: string) {
    return this.currentGraphic() === this.animations[name]
  }

  moveTo(pos: ex.Vector, speed: number) {
    const angle = pos.sub(this.pos).toAngle()

    this.vel = ex.vec(speed * Math.cos(angle), speed * Math.sin(angle))
  }

  scare(direction: ex.Vector) {
    this.isPain = true
    this.isSprinting = false
    this.setAnimation('Pain')

    this.vel = direction.scale(500)
  }
}
