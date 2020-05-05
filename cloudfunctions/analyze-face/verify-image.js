// 云函数入口文件
// const cloud = require('wx-server-sdk')
const tencentcloud = require("tencentcloud-sdk-nodejs")
const { SecretId, SecretKey } = require('./config.js')

// cloud.init({
//   env: cloud.DYNAMIC_CURRENT_ENV
// })

const CmsClient = tencentcloud.cms.v20190321.Client
const models = tencentcloud.cms.v20190321.Models

const Credential = tencentcloud.common.Credential
const ClientProfile = tencentcloud.common.ClientProfile
const HttpProfile = tencentcloud.common.HttpProfile

let cred = new Credential( SecretId, SecretKey )
let httpProfile = new HttpProfile()
httpProfile.endpoint = "cms.tencentcloudapi.com"
let clientProfile = new ClientProfile()
clientProfile.httpProfile = httpProfile
let client = new CmsClient(cred, "ap-guangzhou", clientProfile)

let req = new models.ImageModerationRequest()

module.exports = function (params) {
  req.from_json_string(JSON.stringify(params))
  return new Promise((resolve, reject) => {
    client.ImageModeration(req, function (errMsg, response) {
      if (errMsg) {
        console.log(errMsg)
        reject(errMsg)
      }
      resolve(response)
    })
  })
}