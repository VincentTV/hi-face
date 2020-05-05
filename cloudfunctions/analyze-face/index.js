// 云函数入口文件
const cloud = require('wx-server-sdk')
// const tencentcloud = require("tencentcloud-sdk-nodejs")
// const { SecretId, SecretKey } = require('./config.js')
const detectFace = require('./detect-face')
const verifyImage = require('./verify-image')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

// 云函数入口函数
exports.main = async (event, context) => {
  const { Image } = event
  const verifyRes = await verifyImage({FileContent: Image})
  const { PornDetect, TerrorDetect, PolityDetect } = verifyRes.Data
  if (PornDetect.Score > 90 || TerrorDetect.Score > 90 || PolityDetect.Score > 90) {
    // 图片审核失败
    return { code: 101, errMsg: '图片审核失败，请无上传敏感图片' }
  }

  const detectRes = await detectFace({Image})
  return { verifyRes, detectRes }
}