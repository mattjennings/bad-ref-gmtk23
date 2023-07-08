import { AsepriteResource } from '@excaliburjs/plugin-aseprite'
// I opted for prefixing all assets with type_name rather than
// nesting but I'm find to nest them too. i.e assets.images.level1 etc
export const assets = {
  img_field: new ex.ImageSource('maps/field.png'),
  img_ball: new ex.ImageSource('sprites/ball.png'),
  img_ballShadow: new ex.ImageSource('sprites/ball_shadow.png'),

  ase_playerRed: new AsepriteResource('sprites/players/C1_RED.json'),
  ase_playerBlue: new AsepriteResource('sprites/players/C1_BLUE.json'),
}

class DevLoader extends ex.Loader {
  showPlayButton() {
    return Promise.resolve()
  }

  draw() {}
}

export const loader = import.meta.env.DEV ? new DevLoader() : new ex.Loader()

for (const key in assets) {
  loader.addResource(assets[key as keyof typeof assets])
}
