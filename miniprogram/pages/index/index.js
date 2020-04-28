// miniprogram/pages/index/index.js
import { promisifyAll } from 'miniprogram-api-promise';
const wxp = {}
promisifyAll(wx, wxp)

Page({

  /**
   * 页面的初始数据
   */
  data: {
    originalPath: '',   // 原图地址
    cropItemPaths: []   // 裁剪后地址数组
  },
  // async/await
  upload: async function () {
    let cloudPath = ''
    let sizes = ['50x50', '150x100', '80x45']
    let cropItemPaths = []
    try {
      // 选择图片
      const image = await wxp.chooseImage({ count: 1 })
      wx.showLoading({
        title: '加载中',
      })
      // 上传图片
      let filename = Math.floor(Math.random() * 1000000) + /\.[^\.]+$/.exec(image.tempFilePaths[0])
      cloudPath = 'original-images/' + filename
      const file = await wx.cloud.uploadFile({
        cloudPath,
        filePath: image.tempFilePaths[0]
      })
      // 图片安全审核
      const verify = await wxp.cloud.callFunction({
        name: 'image-verify',
        data: {
          cloudPath
        }
      })
      const { PornInfo, TerroristInfo, PoliticsInfo } = verify.result
      if (PornInfo.Code || TerroristInfo.Code || PoliticsInfo.Code === 0) {
        this.setData({
          originalPath: file.fileID
        })
      } else {
        throw new Error('图片审核失败')
      }
      // 裁剪图片
      const tempFile = await wxp.cloud.getTempFileURL({
        fileList: [file.fileID]
      })
      let tempFileURL = tempFile.fileList[0].tempFileURL
      sizes.forEach(item => {
        cropItemPaths.push(tempFileURL + '?imageMogr2/scrop/' + item)
      })
      this.setData({ cropItemPaths })
      wx.hideLoading()
    } catch (err) {
      console.log(err)
      this.setData({
        originalPath: '',
        cropItemPaths: []
      })
    }
  },
  // Promise 版本
  // upload: async function () {
  //   let cloudPath = ''
  //   let fileID = ''
  //   let sizes = ['50x50', '150x100', '80x45']
  //   wxp
  //     // 选择图片
  //     .chooseImage({ count: 1 })
  //     // 图片上传云存储
  //     .then(res=>{
  //       let filename = Math.floor(Math.random() * 1000000) + /\.[^\.]+$/.exec(res.tempFilePaths[0])
  //       cloudPath = 'original-images/' + filename
  //       wx.showLoading({
  //         title: '加载中',
  //       })
  //       return wx.cloud.uploadFile({
  //         cloudPath,
  //         filePath: res.tempFilePaths[0]
  //       })
  //     })
  //     // 上传成功，提交审核图片
  //     .then(res => {
  //       fileID = res.fileID
  //       return wxp.cloud.callFunction({
  //         name: 'image-verify',
  //         data: {
  //           cloudPath
  //         }
  //       })
  //     })
  //     // 审核通过，获取文件链接
  //     .then(res => {
  //       const { PornInfo, TerroristInfo, PoliticsInfo } = res.result
  //       const verified = PornInfo.Code || TerroristInfo.Code || PoliticsInfo.Code
  //       if (verified === 0) {
  //         this.setData({
  //           originalPath: fileID
  //         })
  //       } else {
  //         throw new Error('图片审核失败')
  //       }
  //       return wxp.cloud.getTempFileURL({
  //         fileList: [ fileID ]
  //       })
  //     })
  //     // 裁剪图片
  //     .then(res => {
  //       let tempFileURL = res.fileList[0].tempFileURL
  //       let cropItemPaths = []
  //       sizes.forEach(item => {
  //         cropItemPaths.push(tempFileURL + '?imageMogr2/scrop/' + item)
  //       })
  //       this.setData({ cropItemPaths })
  //       wx.hideLoading()
  //     })
  //     // 错误处理
  //     .catch(err => {
  //       console.log(err)
  //       this.setData({
  //         originalPath: '',
  //         cropItemPaths: []
  //       })
  //     })
  // },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {

  },

  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady: function () {

  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow: function () {

  },

  /**
   * 生命周期函数--监听页面隐藏
   */
  onHide: function () {

  },

  /**
   * 生命周期函数--监听页面卸载
   */
  onUnload: function () {

  },

  /**
   * 页面相关事件处理函数--监听用户下拉动作
   */
  onPullDownRefresh: function () {

  },

  /**
   * 页面上拉触底事件的处理函数
   */
  onReachBottom: function () {

  },

  /**
   * 用户点击右上角分享
   */
  onShareAppMessage: function () {

  }
})