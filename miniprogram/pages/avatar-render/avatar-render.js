// miniprogram/pages/index/index.js
const getFaceInfo = require('./utils').getFaceInfo
import { promisifyAll } from 'miniprogram-api-promise'
const wxp = {}
promisifyAll(wx, wxp)

const app = getApp()
const rpx = app.globalData.rpx

Page({

  /**
   * 页面的初始数据
   */
  data: {
    imageUrl: '',         // 图片本地路径或头像链接

    originalPath: '',     // 图片本地链接
    originalWidth: 600,   // 原图宽
    originalHeight: 600,  // 原图高

    base64body: '',       // 图片压缩后base64

    showCover: false,     // 是否显示弹窗组件
    renderedPath: '',     // 渲染后的图片
  
    stickers: [
      { id: 0, title: '口罩', count: 11, src: '/images/sticker/mask/mask' },
      { id: 1, title: '头饰', count: 8, src: '/images/sticker/hat/hat' },
      { id: 2, title: '文字', count: 7, src: '/images/sticker/text/text' },
      { id: 3, title: '节日', count: 3, src: '/images/sticker/festival/festival' }
    ],
    active: 0,              // 当前显示贴纸种类

    stickerSize: 200 * rpx, // 默认贴纸大小
    btnSize: 40 * rpx,      // 默认贴纸按钮大小
    showIndex: 0,           // 当前活动贴纸
    stickersList: []        // 页面贴纸列表
  },
  // 切换贴纸种类
  switchSticker (e) {
    if (e.currentTarget.id) {
      this.setData({
        active: e.currentTarget.id
      })
    }
  },
  // 使用头像
  async usingAvatar (e) {
    // if (app.globalData.userInfo) {
    //   this.data.imageUrl = app.globalData.userInfo.avatarUrl
    //   return this.getImageInfo()
    // }
    if (e.detail.errMsg.includes('fail')) {
      wx.showToast({
        title: '允许授权才能使用头像喔～',
        icon: 'none'
      })
      return
    }
    const userInfo = e.detail.userInfo
    if (!userInfo.avatarUrl) {
      wx.showToast({
        title: '您没有设置微信头像，使用不了头像',
        icon: 'none'
      })
      app.globalData.userInfo = userInfo
      return
    }
    userInfo.avatarUrl = userInfo.avatarUrl.replace(/132$/, 0)
    app.globalData.userInfo = userInfo
    this.data.imageUrl = userInfo.avatarUrl
    this.detectImage()
  },
  // 使用相机
  async usingCamera () {
    const image = await wx.chooseImage({
      count: 1,
      sizeType: ['compressed'],
      sourceType: ['camera', 'album']
    })
    this.data.imageUrl = image.tempFilePaths[0]
    this.detectImage()
  },
  // 分析图片
  async detectImage () {
    wx.showLoading({
      title: '人脸五官分析中',
    })
    try {
      // 获取图片信息（本地路径、原图宽高）
      await this.getImageInfo()
      // 图片转base64（压缩图片、转base64）
      await this.imageToBase64()
      // 图片分析（图片审核、人脸五官分析）
      await this.analyzeImage()
      wx.hideLoading()
    } catch (err) {
      this.handleErr(err)
    }
  },
  // 获取图片信息
  async getImageInfo () {
    const imageInfo = await wxp.getImageInfo({
      src: this.data.imageUrl
    })
    // this.data.originalPath = imageInfo.path
    // this.data.originalWidth = imageInfo.width
    // this.data.originalHeight = imageInfo.height
    this.setData({
      originalPath: imageInfo.path,
      originalWidth: imageInfo.width,
      originalHeight: imageInfo.height
    })
  },
  // 图片转base64
  async imageToBase64 () {
    // 压缩图片
    const { originalPath, originalWidth, originalHeight} = this.data
    const canvasWidth = 600 * rpx
    const canvasHeight = 600 * originalHeight / originalWidth * rpx
    const ctx = wx.createCanvasContext("render")
    ctx.clearRect(0, 0, canvasWidth, canvasHeight)
    ctx.drawImage(originalPath, 0, 0, canvasWidth, canvasHeight)
    const tempFilePath = await new Promise((resolve, reject) => {
      ctx.draw(false,async _ => {
        const temp = await wx.canvasToTempFilePath({
          fileType: 'jpg',
          quality: 0.8,
          x: 0,
          y: 0,
          width: canvasWidth,
          height: canvasHeight,
          destWidth: originalWidth,
          destHeight: originalHeight,
          canvasId: 'render'
        })
        resolve(temp.tempFilePath)
      })
    })
    // 转base64
    const fsm = wx.getFileSystemManager()
    const base64body = fsm.readFileSync(tempFilePath, 'base64')
    this.data.base64body = base64body
  },
  // 图片分析（云函数图片审核+五官分析）
  async analyzeImage () {
    // console.log(this.data.base64body)
    const res = await wx.cloud.callFunction({
      name: 'analyze-face',
      data: {
        Image: this.data.base64body
      }
    })
    if (res.result.code && res.result.code === 101) {
      this.setData({
        imageUrl: '',
        base64body: '',
        originalPath: '',
        stickersList: []
      })
      throw res.result
    }
    if (res.result.detectRes.code) {
      if (res.result.detectRes.code.includes('NoFace')) {
        throw { code: 101, errMsg: '图片中没有人脸，请手动添加贴纸' }
      } else {
        throw { code: 101, errMsg: '图片人脸识别失败，请手动添加贴纸' }
      }
    }
    // 数据处理
    const faceInfos = getFaceInfo(res.result.detectRes.FaceShapeSet)
    const { originalWidth } = this.data
    const stickersList = faceInfos.map(item => {
      let {x, y, rotate, faceWidth} = item
      x = x * 600 / originalWidth * rpx
      y = y * 600 / originalWidth * rpx
      faceWidth = faceWidth * 600 / originalWidth
      return {
        src: `/images/sticker/mask/mask${Math.floor(Math.random()*2+1)}.png`,
        x,
        y,
        rotate,
        scale: faceWidth / this.data.stickerSize,
        rotateBtnX: x + faceWidth * rpx,
        rotateBtnY: y + faceWidth * rpx,
        removeBtnX: x - faceWidth * rpx,
        removeBtnY: y - faceWidth * rpx,
        startX: 0,
        startY: 0
      }
    })
    this.setData({
      stickersList,
      showIndex: stickersList.length - 1
    })
  },
  // 错误处理
  handleErr (err) {
    console.log(err)
    const errMsg = err.errMsg ? err.errMsg : ''
    const code = err.code ? err.code : null
    wx.hideLoading()
    if (errMsg) {
      if (code === 101) {
        wx.showToast({
          title: errMsg,
          icon: 'none',
          duration: 4000
        })
      }
    } else {
      wx.showToast({
        title: '图片识别失败，请重试',
        icon: 'none',
        duration: 4000
      })
    }
    // 更新视图
    // this.setData({
    //   imageUrl: '',
    //   base64body: '',
    //   originalPath: '',
    //   stickersList: []
    // })
  },
  // 页面操作
  // 点击添加贴纸
  addSticker: function (e) {
    if (this.data.originalPath==='') {
      return wx.showToast({
        title: '请先上传图片',
        icon: 'none',
        duration: 1500
      })
    }
    const ratio = this.data.originalHeight / this.data.originalWidth
    this.data.stickersList.push({
      src: e.target.dataset.src,
      x: 300 * rpx,
      y: 300 * ratio * rpx,
      rotateBtnX: (300 + 100) * rpx,
      rotateBtnY: 300 * ratio * rpx + 100 * rpx,
      removeBtnX: (300 - 100) * rpx,
      removeBtnY: 300 * ratio * rpx - 100 * rpx,
      scale: 1,
      rotate: 0,
      startX: 0,
      startY: 0
    })
    this.setData({
      stickersList: this.data.stickersList,
      showIndex: this.data.stickersList.length - 1
    })
  },
  // 隐藏贴纸按钮
  hideAllBtn: function () {
    this.setData({
      showIndex: -1
    })
  },
  // 移除图片
  removeImage: function (e) {
    this.setData({
      imageUrl: '',
      base64body: '',
      originalPath: '',
      stickersList: []
    })
  },
  // 开始移动
  touchStart: function (e) {
    let { index, type } = e.target.dataset
    if (type === 'remove' && this.data.stickersList.length !== 0) {
      this.data.stickersList.splice(index, 1)
      return this.setData({
        stickersList: this.data.stickersList
      })
    }
    if (type === 'sticker') {
      this.setData({
        showIndex: index
      })
    }
    this.data.stickersList[index].startX = e.touches[0].clientX
    this.data.stickersList[index].startY = e.touches[0].clientY
  },
  // 移动中
  touchMove: function (e) {
    let { index, type } = e.target.dataset
    if (!type) return
    let currentX = e.touches[0].clientX
    let currentY = e.touches[0].clientY
    let changeX = currentX - this.data.stickersList[index].startX
    let changeY = currentY - this.data.stickersList[index].startY
    if (type === 'sticker') {
      this.data.stickersList[index].x += changeX
      this.data.stickersList[index].y += changeY
      this.data.stickersList[index].rotateBtnX += changeX
      this.data.stickersList[index].rotateBtnY += changeY
      this.data.stickersList[index].removeBtnX += changeX
      this.data.stickersList[index].removeBtnY += changeY
      this.setData({
        stickersList: this.data.stickersList
      })
    }
    if (type === 'rotate') {
      let { x, y, rotateBtnX, rotateBtnY } = this.data.stickersList[index]
      let diff_x_before = rotateBtnX - x
      let diff_y_before = rotateBtnY - y
      let diff_x_after = diff_x_before + changeX
      let diff_y_after = diff_y_before + changeY

      let distance_before = Math.sqrt(diff_x_before * diff_x_before + diff_y_before * diff_y_before)
      let distance_after = Math.sqrt(diff_x_after * diff_x_after + diff_y_after * diff_y_after)

      let angle_before = (Math.atan2(diff_y_before, diff_x_before) / Math.PI) * 180
      let angle_after = (Math.atan2(diff_y_after, diff_x_after) / Math.PI) * 180

      this.data.stickersList[index].rotateBtnX += changeX
      this.data.stickersList[index].rotateBtnY += changeY
      this.data.stickersList[index].removeBtnX -= changeX
      this.data.stickersList[index].removeBtnY -= changeY
      this.data.stickersList[index].scale *= (distance_after / distance_before)
      this.data.stickersList[index].rotate += angle_after - angle_before
      this.setData({
        stickersList: this.data.stickersList
      })
    }
    this.data.stickersList[index].startX = currentX
    this.data.stickersList[index].startY = currentY
  },
  // 渲染图片
  renderImg: function () {
    if (this.data.originalPath === '') {
      return wx.showToast({
        title: '请先上传图片',
        icon: 'none',
        duration: 1500
      })
    }
    if (this.data.stickersList.length === 0) {
      return wx.showToast({
        title: '请先添加贴纸再保存',
        icon: 'none',
        duration: 1500
      })
    }
    const { originalWidth, originalHeight } = this.data
    const canvasWidth = 600 * rpx
    const canvasHeight = 600 * originalHeight / originalWidth * rpx
    const ctx = wx.createCanvasContext("render")
    ctx.clearRect(0, 0, canvasWidth, canvasHeight)
    ctx.drawImage(this.data.originalPath, 0, 0, canvasWidth, canvasHeight)
    this.data.stickersList.forEach(item => {
      ctx.save()
      const { src, x, y, rotate, scale } = item
      const stickerSize = 200 * rpx * scale
      ctx.translate(x, y)
      ctx.rotate((rotate * Math.PI) / 180)
      ctx.drawImage(
        src,
        -stickerSize / 2,
        -stickerSize / 2,
        stickerSize,
        stickerSize
      )
      ctx.restore()
    })
    ctx.draw(false, this.saveToTemp)
  },
  // 保存图片，显示弹窗
  saveToTemp: async function () {
    const { originalWidth, originalHeight } = this.data
    const canvasWidth = 600 * rpx
    const canvasHeight = 600 * originalHeight / originalWidth * rpx
    const temp = await wx.canvasToTempFilePath({
      x: 0,
      y: 0,
      width: canvasWidth,
      height: canvasHeight,
      destWidth: originalWidth,
      destHeight: originalHeight,
      canvasId: 'render'
    })
    this.setData({
      showCover: true,
      renderedPath: temp.tempFilePath
    })
    wx.hideTabBar({aniamtion: true})
    // wx.hideLoading()
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
    let imageUrl = this.data.renderedPath ? this.data.renderedPath : ''
    return {
      title: '图像快速贴纸水印！',
      imageUrl,
      path: '/pages/index/index'
    }
  }
})