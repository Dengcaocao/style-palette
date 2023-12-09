import Application from '@/actions/application'
import type { ExtendContainer, IExtendAttribute, IPoint, MainElm } from '@/actions/types'

// 保存容器元素和信息
let container: ExtendContainer
let customInfo: IExtendAttribute | undefined

function handlePointerdown (
  this: MainElm,
  rootThis: Application,
  e: MouseEvent
) {
  /**
   * 判断是否有元素被选中，如果当前点击的元素与选中元素不相等
   * 移出之前元素选中的效果，将点击的元素设置为选中元素
   */
  const { drawType } = rootThis.graphicsConfig
  container = this.parent as ExtendContainer
  customInfo = container.customInfo as IExtendAttribute
  if (container !== rootThis.container) rootThis.removeSelected()
  if (drawType !== 'select') return
  e.stopPropagation()
  rootThis.container = container
  rootThis.drawSelected()
  rootThis.app.stage.setChildIndex(
    container,
    rootThis.app.stage.children.length - 1
  )
  customInfo.isMove = true
  customInfo.startPoint = { x: e.x, y: e.y}
}

function handleActionEnd (this: MainElm) {
  if (!customInfo) return
  customInfo.isMove = false
}

function handlePointermove (this: MainElm, e: MouseEvent) {
  if (!customInfo?.isMove) return
  const mX = e.x - (customInfo.startPoint as IPoint).x,
        mY = e.y - (customInfo.startPoint as IPoint).y;
  customInfo.startPoint = { x: e.x, y: e.y }
  container.x += mX
  container.y += mY
}

function installElmEvent (this: Application, elm: MainElm) {
  elm.on('pointerenter', () => {
    const { drawType } = this.graphicsConfig
    if (drawType !== 'select') return elm.cursor = 'crosshair'
    elm.cursor = 'move'
  })
  elm.on('pointerdown', (e) => handlePointerdown.call(elm, this, e))
  elm.on('pointerup', handleActionEnd)
  elm.on('pointerleave', handleActionEnd)
  elm.on('pointermove', handlePointermove)
}

export default installElmEvent
