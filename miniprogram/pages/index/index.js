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
    fileID: '',         // fileID
    cloudPath: '',       // 云存储路径
    pass: true,          // 审核结果
    labels: []
  },
  upload: async function () {
    if (this.data.pass === false) {
      this.setData({ pass: true })
    }
    try {
      // 选择图片
      const image = await wxp.chooseImage({ count: 1 })
      wx.showLoading({
        title: '获取特征中',
      })
      // 上传图片
      const filename = Math.floor(Math.random() * 1000000) + /\.[^\.]+$/.exec(image.tempFilePaths[0])
      this.data.cloudPath = 'original-images/' + filename
      const file = await wx.cloud.uploadFile({
        cloudPath: this.data.cloudPath,
        filePath: image.tempFilePaths[0]
      })
      this.data.fileID = file.fileID
      // 图片安全审核
      await this.verify()
    } catch (err) {
      console.log(err)
      wx.showToast({
        title: '上传图片失败，请重试',
        icon: 'none',
        duration: 2000
      })
      this.setData({
        originalPath: ''
      })
    }
  },
  async verify () {
    const verify = await wxp.cloud.callFunction({
      name: 'image-verify',
      data: {
        cloudPath: this.data.cloudPath
      }
    })
    const { PornInfo, TerroristInfo, PoliticsInfo } = verify.result
    if (PornInfo.Score < 90 && TerroristInfo.Score < 90 && PoliticsInfo.Score < 90) {
      // 获取标签
      await this.getImageTag()
    } else {
      wx.hideLoading()
      wx.showToast({
        title: '图片审核未通过',
        icon: 'none',
        duration: 4000
      })
      this.setData({
        originalPath: '',
        labels: [],
        pass: false
      })
      await wx.cloud.deleteFile({
        fileList: [this.data.fileID]
      })
    }
  },
  async getImageTag () {
    const tagInfo = await wxp.cloud.callFunction({
      name: 'image-tag',
      data: {
        cloudPath: this.data.cloudPath
      }
    })
    wx.hideLoading()
    this.setData({
      originalPath: this.data.fileID,
      labels: tagInfo.result.Labels
    })
  },

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