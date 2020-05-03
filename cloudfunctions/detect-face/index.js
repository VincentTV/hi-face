// 云函数入口文件
const cloud = require('wx-server-sdk')
const tencentcloud = require("tencentcloud-sdk-nodejs")
const { SecretId, SecretKey } = require('./config.js')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

const IaiClient = tencentcloud.iai.v20180301.Client
const models = tencentcloud.iai.v20180301.Models

const Credential = tencentcloud.common.Credential
const ClientProfile = tencentcloud.common.ClientProfile
const HttpProfile = tencentcloud.common.HttpProfile

let cred = new Credential( SecretId, SecretKey )
let httpProfile = new HttpProfile()
httpProfile.endpoint = "iai.tencentcloudapi.com"
let clientProfile = new ClientProfile()
clientProfile.httpProfile = httpProfile
let client = new IaiClient(cred, "ap-guangzhou", clientProfile)

let req = new models.DetectFaceRequest()


// 云函数入口函数
exports.main = async (event, context) => {
  const params = JSON.stringify(event.params)
  req.from_json_string(params)
  return await new Promise((resolve, reject) => {
    client.DetectFace(req, function (errMsg, response) {
      if (errMsg) {
        resolve(errMsg)
      }
      resolve(response)
    })
  })
}