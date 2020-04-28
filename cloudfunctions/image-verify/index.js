// 云函数入口文件
const cloud = require('wx-server-sdk')
const extCi = require("@cloudbase/extension-ci");
const tcb = require("tcb-admin-node");


// 初始化 cloud
cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})
tcb.init({
  env: 'test-0k2y8'
});
tcb.registerExtension(extCi);

// 图片审核
async function verify(cloudPath) {
  try {
    const res = await tcb.invokeExtension('CloudInfinite', {
      action: 'DetectType',
      cloudPath,
      operations: { type: 'porn,terrorist,politics' }
    })
    return res.data.RecognitionResult
  } catch (err) {
    return err
  }
}

// 云函数入口函数
exports.main = async (event, context) => {
  return verify(event.cloudPath)
}