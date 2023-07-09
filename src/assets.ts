import { AsepriteResource } from '@excaliburjs/plugin-aseprite'

export const assets = {
  img_field: new ex.ImageSource('maps/field.png'),
  img_shadow: new ex.ImageSource('sprites/players/player_shadow.png'),
  img_netLeftBack: new ex.ImageSource('sprites/net/net_left_back.png'),
  img_netLeftFront: new ex.ImageSource('sprites/net/net_left_front.png'),
  img_netRightBack: new ex.ImageSource('sprites/net/net_right_back.png'),
  img_netRightFront: new ex.ImageSource('sprites/net/net_right_back.png'),
  img_hudInstructions: new ex.ImageSource(
    'sprites/hud_instructions/hud_instructions.png'
  ),
  img_blueTeamBadge: new ex.ImageSource(
    'sprites/team_badges/blue_team_badge.png'
  ),
  img_redTeamBadge: new ex.ImageSource(
    'sprites/team_badges/red_team_badge.png'
  ),
  img_fontWhite: new ex.ImageSource('sprites/font-white.png'),
  img_fontBlack: new ex.ImageSource('sprites/font-black.png'),

  ase_ballVertical: new AsepriteResource('sprites/ball/ball_vertical.json'),
  ase_ballHorizontal: new AsepriteResource('sprites/ball/ball_horizontal.json'),
  ase_character1Red: new AsepriteResource('sprites/players/C1_RED.json'),
  ase_character2Red: new AsepriteResource('sprites/players/C2_RED.json'),
  ase_character3Red: new AsepriteResource('sprites/players/C3_RED.json'),
  ase_character4Red: new AsepriteResource('sprites/players/C4_RED.json'),
  ase_character5Red: new AsepriteResource('sprites/players/C5_RED.json'),
  ase_character6Red: new AsepriteResource('sprites/players/C6_RED.json'),
  ase_character1Blue: new AsepriteResource('sprites/players/C1_BLUE.json'),
  ase_character2Blue: new AsepriteResource('sprites/players/C2_BLUE.json'),
  ase_character3Blue: new AsepriteResource('sprites/players/C3_BLUE.json'),
  ase_character4Blue: new AsepriteResource('sprites/players/C4_BLUE.json'),
  ase_character5Blue: new AsepriteResource('sprites/players/C5_BLUE.json'),
  ase_character6Blue: new AsepriteResource('sprites/players/C6_BLUE.json'),
  ase_goalieBlue: new AsepriteResource('sprites/players/GOALIE_BLUE.json'),
  ase_goalieRed: new AsepriteResource('sprites/players/GOALIE_RED.json'),
  ase_referee: new AsepriteResource('sprites/referee/REFEREE.json'),
  ase_scoreNumbers: new AsepriteResource(
    'sprites/score_numbers/score_numbers.json'
  ),
  ase_icecreamTruck: new AsepriteResource(
    'sprites/ice_cream_truck/ice_cream_truck.json'
  ),
  ase_icecreamCone: new AsepriteResource(
    'sprites/ice_cream_cone/ice_cream_cone.json'
  ),
  ase_collectCelebration: new AsepriteResource(
    'sprites/collect_celebration/collect_celebration.json'
  ),

  snd_clack: new ex.Sound('sfx/Clack.mp3'),
  snd_cleanImpact: new ex.Sound('sfx/CleanImpact.mp3'),
  snd_whistle: new ex.Sound('sfx/Whistle.mp3'),
  snd_dashA: new ex.Sound('sfx/DashA.mp3'),
  snd_dashB: new ex.Sound('sfx/DashB.mp3'),
  snd_crowdA: new ex.Sound('sfx/CrowdA.mp3'),
  snd_crowdBHigh: new ex.Sound('sfx/CrowdBHigh.mp3'),
  snd_crowdBLow: new ex.Sound('sfx/CrowdBLow.mp3'),
  snd_bell: new ex.Sound('sfx/Bell1.mp3'),
  snd_watchOut: new ex.Sound('sfx/WatchOut.mp3'),
  snd_taunt: new ex.Sound('sfx/Taunt.mp3'),
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
