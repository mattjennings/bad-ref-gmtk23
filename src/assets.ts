// I opted for prefixing all assets with type_name rather than
// nesting but I'm find to nest them too. i.e assets.images.level1 etc
export const assets = {
  img_level1: new ex.ImageSource('maps/level1.png'),
  img_player: new ex.ImageSource('sprites/player.png'),

  // snd_jump: ... etc
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
