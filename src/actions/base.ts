import * as PIXI from 'pixi.js'
import { createOffsetArr, getAngle } from '@/utils/utils'
import installElmEvent from '@/event/elmEvent'
import type { IBaseParams, ExtendContainer, ExtendGraphics } from './types'
import type { IElementStyle } from '@/stores/types'

class Base {
  app: PIXI.Application
  dom: HTMLElement
  scale: number
  // 样式配置对象
  styleConfig: IElementStyle
  container: ExtendContainer | undefined
  startPoints: { x: number, y: number } = { x: 0, y: 0 }
  isDraw: boolean = false
  constructor ({ width, height, bgColor, styleConfig, dom }: IBaseParams) {
    this.app = new PIXI.Application({
      width: width * 2,
      height: height * 2,
      backgroundColor: bgColor || 0xffffff,
      antialias: true,
      eventMode: 'static'
    })
    this.dom = dom
    this.scale = this.app.screen.width / width
    this.styleConfig = styleConfig
    this.initCanvasSize(width, height)
    this.createMesh()
    dom.appendChild(this.app.view as HTMLCanvasElement)
  }

  /**
   * 初始化画布大小
   * @param width 原始宽度
   * @param height 原始高度
   */
  initCanvasSize (width: number, height: number) {
    if (this.app.view.style) {
      this.app.view.style.width = `${width}px`
      this.app.view.style.height = `${height}px`
    }
    // 放大2倍
    this.app.stage.scale.set(this.scale)
    this.app.stage.position = { x: -width, y: -height }
  }

  /**
   * 网格线
   * @param isShow 是展示网格线，false 将会被销毁 
   * @returns 
   */
  createMesh (isShow: boolean = true) {
    if (!isShow) {
      const element = this.app.stage.getChildByName('mesh')
      return element?.destroy()
    }
    const mesh = new PIXI.Graphics()
    this.app.stage.addChildAt(mesh, 0)
    const width = this.app.screen.width
    const height = this.app.screen.height
    // 添加可交互区域
    mesh.name = 'mesh'
    mesh.hitArea = new PIXI.Rectangle(0, 0, width, height)
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
   * 获取映射点
   */
  getMappingPoints (x: number, y: number) {
    return {
      x: x + Math.abs(this.app.stage.x) / this.scale,
      y: y + Math.abs(this.app.stage.y) / this.scale
    }
  }

  /**
   * 手绘描边
   * @param elm 描边元素
   * @param index 控制点索引
   * @param vertex 顶点信息
   * @returns 
   */
  drawStroke (
    elm: ExtendGraphics,
    index: number,
    vertex: number[] = []
  ) {
    elm.beginFill(0, 0)
    elm.lineStyle({
      ...this.styleConfig,
      cap: PIXI.LINE_CAP.ROUND,
      join: PIXI.LINE_JOIN.ROUND
    })
    const { drawType, type } = this.styleConfig as IElementStyle
    if (drawType === 'paintingBrush') return
    if (drawType === 'arc' && type === 'simple' ) {
      return
    }
    // 记录点位消息
    const offsetPoints = (this.container as ExtendContainer).offsetPoints || []
    const qcPoints = (this.styleConfig as IElementStyle).type === 'simple'
      ? vertex
      : offsetPoints[index]
        .map((item, index) => {
          const vertexIndex = index % vertex.length
          return item + vertex[vertexIndex]
        })
    elm.qcPoints = qcPoints.length
      ? qcPoints
      : elm.qcPoints
    for (let i = 0; i < (elm.qcPoints as number[]).length; i+=6) {
      const [x, y, cpX, cpY, toX, toY] = (elm.qcPoints as number[]).slice(i, i+6)
      elm.moveTo(x, y)
      // 都使用贝塞尔曲线能拿到图形上每个点的信息
      elm.quadraticCurveTo(cpX, cpY, toX, toY)
    }
  }

  /**
   * 创建一个主元素，并添加事件监听
   * @param vertex 顶点信息
   * @param maxNum 随机值的最大数
   * @returns 
   */
  createElement (
    vertex: number[] = [],
    maxNum: number
  ) {
    const graphics: ExtendGraphics = new PIXI.Graphics()
    graphics.name = 'main_graphics'
    graphics.styleConfig = { ...this.styleConfig }
    installElmEvent.call(this as any, graphics)
    const container = this.container as ExtendContainer
    container.removeChildren()
    container.addChild(graphics)
    // 获取图形在容器中位置，并设置随机偏移点
    const index = container.getChildIndex(graphics)
    if (!container.offsetPoints) {
      container.offsetPoints = [createOffsetArr(maxNum)]
    } else {
      container.offsetPoints[index] = container.offsetPoints[index] || createOffsetArr(maxNum)
    }
    this.drawStroke(graphics, index, vertex)
    this.drawBackground(graphics, vertex)
    container.setChildIndex(graphics, container.children.length - 1)
    return graphics
  }

  /**
   * 背景绘制
   * @param elm 绘制背景的元素
   * @param vertex 顶点信息
   * @returns 
   */
  drawBackground (elm: ExtendGraphics, vertex: number[] = []) {
    const { drawType ,alpha, type, fillColor, fillStyle } = elm.styleConfig as IElementStyle
    if (fillColor === 'transparent' || ['mark', 'straightLine'].includes(drawType)) return
    const lineStyle = new PIXI.LineStyle()
    lineStyle.width = 1
    lineStyle.color = parseInt(fillColor.slice(1), 10)
    lineStyle.alpha = alpha
    lineStyle.cap = PIXI.LINE_CAP.ROUND
    lineStyle.join = PIXI.LINE_JOIN.ROUND
    // 创建背景图形
    const backgroundElm_left = new PIXI.Graphics()
    backgroundElm_left.name = 'background_elm_left'
    backgroundElm_left.position.set(elm.x, elm.y)
    backgroundElm_left.lineStyle({
      ...elm.styleConfig,
      width: 1,
      color: fillColor,
      cap: PIXI.LINE_CAP.ROUND,
      join: PIXI.LINE_JOIN.ROUND
    })
    this.container?.addChild(backgroundElm_left)
    this.container?.setChildIndex(backgroundElm_left, this.container.children.length - 2)
    if (fillStyle === 'simple') {
      backgroundElm_left.beginFill(fillColor, alpha)
      drawType !== 'arc' && backgroundElm_left.drawPolygon(vertex)
      return
    }
    // 获取图形上的每个点
    elm.getBounds()
    const graphicsData = elm.geometry.graphicsData
    let p: number[] = []
    const length = type === 'simple'
      ? graphicsData.length
      : graphicsData.length / 2
    for (let i = 0; i < length; i++) {
      // 处理不同类型使绘制方向一样
      if (drawType === 'rect') {
        p = [...p, ...graphicsData[i].points]
      }
      if (drawType === 'arc') {
        // 处理普通弧形的点
        if (type === 'simple') {
          p = graphicsData[i].points.filter((_, index) => index % 4 < 2)
          let index = Math.floor(p.length / 8)
          index % 2 === 1 && index++
          const prefixP = p.slice(0, index)
          p = p.slice(index).concat(prefixP)
          continue
        }
        p = [...p, ...graphicsData[i].points]
        if (i === length - 1) {
          let index = graphicsData[0].points.length / 2
          index % 2 === 1 && index++
          const prefixP = p.slice(0, index)
          p = p.slice(index).concat(prefixP)
        }
      }
      if (drawType === 'diamond' && i % 2 === 1) {
        p = [...p, ...graphicsData[i].points]
      }
    }
    // 获取主图形的偏移量
    const getOffset = () => {
      const offsetPoints = (elm.parent as ExtendContainer).offsetPoints
      return (offsetPoints as number[][])[0]
        .sort(() => Math.random() - 0.5) // 打乱数组
        .slice(-4)
    }
    // 绘制背景曲线
    for (let i = 0; i < p.length/2; i+=2) {
      let [x, y] = p.slice(i, i + 2)
      let [toX, toY] = p.slice(p.length - 2 - i)
      for (let j = 0; j < 2; j++) {
        const [o1, o2, o3, o4] = getOffset()
        x += o1, y+= o2
        toX += o3, toY+= o4
        const { width, height } = getAngle({x, y}, {x: toX, y: toY})
        backgroundElm_left.moveTo(x, y)
        backgroundElm_left.quadraticCurveTo(x + width/2, y + height/2, toX, toY)
      }
    }
    if (fillStyle === 'grid') {
      const backgroundElm_right = new PIXI.Graphics()
      backgroundElm_right.name = 'background_elm_right'
      this.container?.addChild(backgroundElm_right)
      this.container?.setChildIndex(backgroundElm_right, this.container.children.length - 2)
      backgroundElm_right.lineStyle(backgroundElm_left.line)
      backgroundElm_right.position.set(elm.x + elm.geometry.bounds.maxX, elm.y)
      backgroundElm_left.geometry.graphicsData.forEach(item => {
        backgroundElm_right.drawShape(item.shape)
      })
      backgroundElm_right.scale.set(-1, 1)
    }
  }

  copy (copyElm: ExtendGraphics) {}
 
  /**
   * 删除元素或清空画布
   * @param isDelElm 是否是删除元素
   * @returns 
   */
  clear (isDelElm: boolean) {
    if (isDelElm) return this.app.stage.removeChild(this.container as PIXI.DisplayObject)
    this.app.stage.children
      .filter(item => item.name !== 'mesh')
      .forEach(item => this.app.stage.removeChild(item))
  }

  /**
   * 将canvas 转为 base64
   * @param type 图片类型 png | jpeg
   * @returns 
   */
  async canvas2Base64 (type: string = 'image/jpeg') {
    // 获取需要保存的元素
    const saveElms = this.container
      ? [this.container]
      : this.app.stage.children.filter(item => item.name !== 'mesh')
    // 获取每个容器的定位和宽高
    const elmBounds = saveElms.map(container => ({
      x: container.x,
      y: container.y
    }))
    // 使用 position x,y 排序拿取 minX maxX
    const rectangleMinX = elmBounds
      .map(item => item.x)
      .sort((a, b) => a - b)
      .find((_, index) => index === 0)
    const rectangleMinY = elmBounds
      .map(item => item.y)
      .sort((a, b) => a - b)
      .find((_, index) => index === 0)
    // 创建白色背景元素并添加到对应的容器中
    const imgBgElm = new PIXI.Graphics();
    (this as any).removeSelected()
    if (type === 'image/jpeg') {
      if (this.container) {
        this.container.addChildAt(imgBgElm, 0)
      } else {
        saveElms.unshift(imgBgElm)
        imgBgElm.position.set(rectangleMinX, rectangleMinY)
        this.app.stage.addChildAt(imgBgElm, 1)
      }
    }
    // 创建一个保存容器对象
    const saveDisplayObject = new PIXI.Container()
    saveDisplayObject.addChild(...saveElms)
    const img = await this.app.renderer.extract.image(saveDisplayObject, type)
    imgBgElm.beginFill(0xffffff, 1)
    imgBgElm.drawRect(
      -8, -8,
      img.width + 8,
      img.height + 8
    )
    const base64 = await this.app.renderer.extract.base64(saveDisplayObject, type)
    // 将元素添加到另一个容器中后，导致stage中的图形消失，需再次添加stage中，并删除白色背景
    if (this.container) {
      this.container.removeChild(imgBgElm);
      (this as any).drawSelected()
    } else {
      this.app.stage.removeChild(imgBgElm)
      type === 'image/jpeg' && saveElms.shift()
    }
    this.app.stage.addChild(...saveElms)
    return base64
  }
}

export default Base
