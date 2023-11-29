import Draw from './draw'
import { Container, Sprite } from 'pixi.js'
import installElmEvent from '@/event/elmEvent'

class spriteImage extends Draw {
  drawImage (url: string) {
    this.container = new Container()
    this.app.stage.addChild(this.container)
    const sprite = Sprite.from(url)
    installElmEvent.call(this as any, sprite)
    // sprite.eventMode = 'none'
    sprite.name = 'main_sprite'
    const image = new Image()
    image.src = url
    image.onload = () => {
      const width = 200,
            height = width * image.height / image.width
      sprite.width = width
      sprite.height = height
      const { x, y } = this.getMappingPoints(window.innerWidth / 2, window.innerHeight / 2)
      sprite.position.set(x - width / 2, y - height / 2)
      this.container?.addChild(sprite)
      this.drawSelected()
    }
  }
}

export default spriteImage
