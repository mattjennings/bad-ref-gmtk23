import { AsepriteResource } from '@excaliburjs/plugin-aseprite'

export const assets = {
  img_field: new ex.ImageSource('maps/field.png'),
  img_ball: new ex.ImageSource('sprites/ball.png'),
  img_shadow: new ex.ImageSource('sprites/players/player_shadow.png'),
  img_netLeftBack: new ex.ImageSource('sprites/net/net_left_back.png'),
  img_netLeftFront: new ex.ImageSource('sprites/net/net_left_front.png'),
  img_netRightBack: new ex.ImageSource('sprites/net/net_right_back.png'),
  img_netRightFront: new ex.ImageSource('sprites/net/net_right_back.png'),

  ase_ballVertical: new AsepriteResource('sprites/ball/ball_vertical.json'),
  ase_ballHorizontal: new AsepriteResource('sprites/ball/ball_horizontal.json'),
  ase_character1Red: new AsepriteResource('sprites/players/C1_RED.json'),
  ase_character2Red: new AsepriteResource('sprites/players/C2_RED.json'),
  ase_character1Blue: new AsepriteResource('sprites/players/C1_BLUE.json'),
  ase_character2Blue: new AsepriteResource('sprites/players/C2_BLUE.json'),
  ase_goalieBlue: new AsepriteResource('sprites/players/GOALIE_BLUE.json'),
  ase_goalieRed: new AsepriteResource('sprites/players/GOALIE_RED.json'),
  ase_referee: new AsepriteResource('sprites/referee/REFEREE.json'),
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
