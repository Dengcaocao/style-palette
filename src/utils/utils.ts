/**
 * 创建一个偏移量数组
 * @param num 边的数量
 * @param maxOffset 最大偏移量
 */
export const createOffsetArr = (num: number, maxOffset = 5) => {
  /**
   * 一条线由开始点(x,y)、移动点(x,y)和控制点(x,y)组成，共6个
   */
  const createRandomNum = () => Math.random() * (maxOffset * 2) - maxOffset
  // *2绘制两次
  return new Array(num * 6 * 2)
    .fill(0)
    .map(createRandomNum)
}