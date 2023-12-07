import * as PIXI from 'pixi.js'
import Application from '@/actions/application'
import Pinia from '@/stores/index'
import { useConfigStore } from '@/stores/config'
import { toRefs } from 'vue'

const { drawType } = toRefs(useConfigStore(Pinia))

/**
 * 处理场景滚动
 * @param this 
 * @param stage 场景
 * @param param2 
 * @returns 
 */
function handleWheel (this: Application, { deltaX, deltaY }: WheelEvent) {
  // 输入时禁止滚动
  const textareaList = document.querySelectorAll('textarea')
  if (textareaList.length) return
  const stage = this.app.stage
  stage.x += deltaX * -1
  stage.y += deltaY * -1
  const screenWidth = this.app.screen.width,
        screenHeight = this.app.screen.height
  // 过滤掉网格元素
  const elements = stage.children.filter(item => item.name !== 'mesh')
  if (stage.x >= 0 || stage.x <= -screenWidth) {
    elements
      .forEach(item => {
        item.x = item.x + (screenWidth / this.scale) / 2 * (deltaX < 0 ? 1 : -1)
      })
    stage.x = -(screenWidth / this.scale)
  }
  if (stage.y >= 0 || stage.y <= -screenHeight) {
    elements
      .forEach(item => {
        item.y = item.y + (screenHeight / this.scale) / 2 * (deltaY < 0 ? 1 : -1)
      })
    stage.y = -(screenHeight / this.scale)
  }
}

function handlePointerdown (this: Application, { x, y }: MouseEvent) {
  this.startPoints = this.getMappingPoints(x, y)
  if (this.styleConfig.drawType === 'image') return
  if (this.styleConfig.drawType === 'text') return this.drawText(this.startPoints)
  // 绘制之前删除选中效果
  if (this.container) {
    this.removeSelected()
    this.container = undefined
  }
  this.container = new PIXI.Container()
  this.container.position.set(this.startPoints.x, this.startPoints.y)
  this.app.stage.addChild(this.container)
  if (this.keys.includes('space')) document.body.style.cursor = 'grabbing'
  this.isDraw = true
}

// 开始绘制
function handlePointermove (this: Application, { x, y }: MouseEvent) {
  if (!this.isDraw) return
  const point = this.getMappingPoints(x, y)
  const deltaX = (point.x - this.startPoints.x) * -1
  const deltaY = (point.y - this.startPoints.y) * -1
  if (this.keys.includes('space')) return handleWheel.call(this, { deltaX, deltaY } as WheelEvent)
  const type = this.styleConfig.drawType
  const methods: any = {
    rect: this.drawRect.bind(this),
    diamond: this.drawDiamond.bind(this),
    arc: this.drawArc.bind(this),
    mark: this.drawMark.bind(this),
    straightLine: this.drawMark.bind(this),
    paintingBrush: this.paintingBrush.bind(this)
  }
  methods[type] && methods[type](point.x, point.y)
}

// 结束绘制
function handleDrawEnd (this: Application) {
  if (!this.container?.children.length) {
    this.app.stage.removeChild(this.container as PIXI.DisplayObject)
    this.container = undefined
  }
  const disabledUDS = ['select', 'paintingBrush', 'text', 'image']
  if (!disabledUDS.includes(this.styleConfig.drawType) && this.container) {
    this.drawSelected()
  }
  if (this.keys.includes('space')) document.body.style.cursor = 'default'
  this.isDraw = false
  // this.styleConfig.drawType !=='paintingBrush' && (drawType.value = 'select')
}

function installAppEvent (this: Application) {
  /**
   * 滚动事件处理
   * @param e 事件对象
   */
  const stage = this.app.stage
  stage.on('wheel', handleWheel.bind(this))
  stage.on('pointerdown', handlePointerdown.bind(this))
  stage.on('pointermove', handlePointermove.bind(this))
  stage.on('pointerup', handleDrawEnd.bind(this))
  stage.on('pointerleave', handleDrawEnd.bind(this))
}

export default installAppEvent
