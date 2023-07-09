import * as ex from 'excalibur'

export const LEFT = 'LEFT'
export const RIGHT = 'RIGHT'
export const UP = 'UP'
export const DOWN = 'DOWN'

export class DirectionQueue {
  heldDirections: any[] = []
  controls: any

  constructor(controls) {
    this.controls = controls
  }

  get direction() {
    return this.heldDirections[0] ?? null
  }

  add(dir) {
    const exists = this.heldDirections.includes(dir)
    if (exists) {
      return
    }
    this.heldDirections.unshift(dir)
  }

  remove(dir) {
    this.heldDirections = this.heldDirections.filter((d) => d !== dir)
  }

  update(engine) {
    ;[
      ...this.controls.left.map((key) => ({ key, dir: LEFT })),
      ...this.controls.right.map((key) => ({ key, dir: RIGHT })),
      ...this.controls.up.map((key) => ({ key, dir: UP })),
      ...this.controls.down.map((key) => ({ key, dir: DOWN })),
    ].forEach((group) => {
      if (engine.input.keyboard.wasPressed(group.key)) {
        this.add(group.dir)
      }
      if (engine.input.keyboard.wasReleased(group.key)) {
        this.remove(group.dir)
      }
    })
  }
}
