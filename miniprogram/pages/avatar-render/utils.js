
function getFaceInfo (faceInfo) {
  return faceInfo.map(item => {
    const { Mouth, LeftEyeBrow, RightEyeBrow } = item
    const { leftPoint, rightPoint } = getMouthLeftRigthPoint(Mouth)
    const distanceX = rightPoint.X - leftPoint.X
    const distanceY = rightPoint.Y - leftPoint.Y
    // 中心点
    const x = leftPoint.X + parseInt(distanceX/2)
    const y = leftPoint.Y + parseInt(distanceY/2)
    // 旋转角度
    const rotate = Math.atan2(distanceY,distanceX) / Math.PI * 180
    // 脸部宽度
    const faceWidth = getFaceWith(LeftEyeBrow, RightEyeBrow)
    return {
      x,
      y,
      rotate,
      faceWidth
    }
  })
}
// 脸部宽度，两眉毛端点距离
function getFaceWith (LeftEyeBrow, RightEyeBrow) {
  const distanceX = LeftEyeBrow[0].X - RightEyeBrow[0].X
  const distanceY = LeftEyeBrow[0].Y - RightEyeBrow[0].Y
  return Math.sqrt(Math.pow(distanceX, 2) + Math.pow(distanceY, 2))
}

function getMouthLeftRigthPoint (Mouth) {
  let xPoints = Mouth.map(item => item.X).sort((a, b) => a - b)
  let minX = xPoints[0]
  let maxX = xPoints[xPoints.length - 1]
  let leftPoint = {}
  let rightPoint = {}
  Mouth.forEach(item => {
    if (item.X === minX) leftPoint = item
    if (item.X === maxX) rightPoint = item
  })
  return {
    leftPoint,
    rightPoint
  }
}

module.exports = {getFaceInfo}