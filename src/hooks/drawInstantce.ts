import * as PIXI from 'pixi.js'
import type { Ref } from 'vue'

export const usePixiApp = () => {
  class CreateSceen {
    app: PIXI.Application<PIXI.ICanvas>
    container: Ref
    // isDraw: boolean
    width: number
    height: number
    downPoint: { x: number; y: number}
    upPoint: { x: number; y: number}
    graphics: PIXI.Graphics | undefined
    constructor (container: Ref, width: number, height: number) {
      this.app = new PIXI.Application({
        width: width * 2,
        height: height * 2,
        backgroundColor: 0xffffff,
        antialias: true,
        eventMode: 'static'
      })
      container.value.appendChild(this.app.view)
      this.container = container
      this.width = width
      this.height = height
      // this.isDraw = false
      this.downPoint = this.upPoint = { x: 0, y: 0 }
      this.initCanvasSize(width, height)
      this.createBgMesh()
      this.installEventListener()
    }
    // setBgColor () {
    //   this.app.renderer.background.color = '#00ff00'
    // }
    /**
     * @description: 网格背景绘制
     * @return {*}
     */
    createBgMesh () {
      const mesh = new PIXI.Graphics()
      this.app.stage.addChild(mesh)
      const width = this.app.screen.width
      const height = this.app.screen.height
      mesh.beginFill('#ffffff', 0)
      mesh.drawRect(0, 0, width, height)
      mesh.endFill()
      const hitArea = new PIXI.Rectangle(0, 0, width, height)
      mesh.hitArea = hitArea
      mesh.lineStyle(1, 0x000000, 0.1)
      // 垂直线条
      for (let i = 0; i < width; i += 20) {
        mesh.moveTo(i, 0)
        mesh.lineTo(i, height)
      }
      // 水平线条
      for (let i = 0; i < height; i += 20) {
        mesh.moveTo(0, i)
        mesh.lineTo(width, i)
      }
    }

    /**
     * 初始化画布大小
     * @param width 
     * @param height 
     */
    initCanvasSize (width: number, height: number) {
      if (this.app.view.style) {
        this.app.view.style.width = `${width}px`
        this.app.view.style.height = `${height}px`
      }
      this.app.stage.scale.set(this.app.screen.width / width)
      this.app.stage.position = { x: -width, y: -height }

      const mesh = new PIXI.Graphics()
      this.app.stage.addChild(mesh)
      mesh.beginFill('#ff0000', 1)
      mesh.drawCircle(width, height, 8)
      mesh.endFill()
    }

    /**
     * 滚动事件处理
     * @param e 事件对象
     */
    _handleWheel (e: WheelEvent) {
      this.app.stage.x += e.deltaX * -1
        this.app.stage.y += e.deltaY * -1
        if (this.app.stage.x >= 0 || this.app.stage.x <= -this.app.screen.width) {
          this.app.stage.children
            .slice(0, 1)
            .forEach(item => {
              item.x = item.x + this.width / 2 * (e.deltaX < 0 ? 1 : -1)
            })
          this.app.stage.x = -this.width
        }
        if (this.app.stage.y >= 0 || this.app.stage.y <= -this.app.screen.height) {
          this.app.stage.children
            .slice(0, 1)
            .forEach(item => {
              item.y = item.y + this.width / 2 * (e.deltaY < 0 ? 1 : -1)
            })
          this.app.stage.y = -this.height
        }
    }

    installEventListener () {
      this.container.value.addEventListener('wheel', (e: WheelEvent) => this._handleWheel(e))
    }
  }
  return {
    CreateSceen
  }
}
