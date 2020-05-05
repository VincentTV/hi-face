// pages/detectface/detectface.js
import { promisify } from 'miniprogram-api-promise';
const EXPRESSION = ['黯然伤神', '半嗔半喜', '似笑非笑', '笑逐颜开', '莞尔一笑', '喜上眉梢', '眉开眼笑', '笑尽妖娆', '心花怒放', '一笑倾城']
const STATUS = ['无', '有']

Page({

  /**
   * 页面的初始数据
   */
  data: {
    safeTop: 0,           // 状态栏高度

    fileID: '',           // fileID
    cloudPath: '',        // 云存储路径
    cloudUrl: '',         // 云存储图片url
    cropImageUrl: '',     // 裁剪图片url
    imageAve: '',         // 图片主色调
    faceInfos: [],        // 人脸信息
    currentFaceIndex: -1, // 当前人脸选中框
    labels: []            // 图片标签

  },
  async upload () {
    try {
      // 选择图片
      const image = await wx.chooseImage({ count: 1 })
      wx.showLoading({
        title: '人脸识别中',
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
      // 获取主色调
      await this.getImageAve()
      // 获取标签
      await this.getImageTag()
      // 截图
      this.getCropImageUrl(600,600)
      // 人脸识别
      await this.detectFace()
      // 更新视图
      const { cropImageUrl, faceInfos, imageAve, labels } = this.data
      this.setData({
        currentFaceIndex: -1,
        imageAve,
        cropImageUrl,
        faceInfos,
        labels
      })
      wx.hideLoading()
    } catch (err) {
      this.handleErr(err)
    }
  },
  // 图片审核
  async verify() {
    const verify = await wx.cloud.callFunction({
      name: 'image-verify',
      data: {
        cloudPath: this.data.cloudPath
      }
    })
    const { PornInfo, TerroristInfo, PoliticsInfo } = verify.result
    if (PornInfo.Score > 90 || TerroristInfo.Score > 90 || PoliticsInfo.Score > 90) {
      // 图片审核失败
      await wx.cloud.deleteFile({
        fileList: [this.data.fileID]
      })
      throw {
        code: 101,
        errMsg: '图片审核失败，请不要上传敏感图片'
      }
    }
  },
  // 获取图片主色调
  async getImageAve () {
    const tempFile = await wx.cloud.getTempFileURL({
      fileList: [this.data.fileID]
    })
    const cloudUrl = tempFile.fileList[0].tempFileURL
    this.data.cloudUrl = cloudUrl

    // 发送请求
    await promisify(wx.request)({
      url: cloudUrl + '?imageAve'
    }).then(res => {
      this.data.imageAve = '#' + res.data.RGB.substring(2)
    })
  },
  // 获取截图url
  getCropImageUrl (width, height) {
    const rule = `?imageMogr2/thumbnail/!${width}x${height}r|imageMogr2/scrop/${width}x${height}/`
    this.data.cropImageUrl = this.data.cloudUrl + rule
  },
  // 人脸识别
  async detectFace () {
    const res = await wx.cloud.callFunction({
      name: 'detect-face',
      data: {
        params: {
          Url: this.data.cropImageUrl,
          MaxFaceNum: 5,
          NeedFaceAttributes: 1
        }
      }
    })
    if (res.result.code) {
      if (res.result.code.includes('NoFace')) {
        // 未检测到人脸
        await wx.cloud.deleteFile({
          fileList: [this.data.fileID]
        })
        throw {
          code: 101,
          errMsg: '未检测到人脸，请上传人脸照片'
        }
      }
    }
    this.data.faceInfos = res.result.FaceInfos.map(item => {
      const { Age, Expression, Beauty, Glass, Hat, Mask } = item.FaceAttributesInfo
      const { X, Y, Width, Height } = item
      const rule = `imageMogr2/cut/${Width}x${Height}x${X}x${Y}`
      const centerX = parseInt(X + Width / 2)
      const FaceInfoBoxX =  centerX < 300 ? X + Width + 10 : X - 200 - 10
      // 重写数据 - 脸部截图链接
      item.FaceImageUrl = this.data.cropImageUrl + '|' + rule
      // 重写数据 - 脸部数据
      item.FaceInfo = {
        X: FaceInfoBoxX,
        Y,
        Age,
        Expression: EXPRESSION[Math.floor(Expression/10)],
        Beauty,
        Glass: STATUS[Number(Glass)],
        Hat: STATUS[Number(Hat)],
        Mask: STATUS[Number(Mask)]
      }
      return item
    })
  },
  // 获取图片标签
  async getImageTag() {
    const tagInfo = await wx.cloud.callFunction({
      name: 'image-tag',
      data: {
        cloudPath: this.data.cloudPath
      }
    })
    this.data.labels = tagInfo.result.Labels
  },
  // 人脸点击
  changeFace (e) {
    const currentIndex = e.target.dataset.index
    if (currentIndex == this.data.currentFaceIndex) {
      this.setData({
        currentFaceIndex: -1
      })
    } else {
      this.setData({
        currentFaceIndex: e.target.dataset.index
      })
    }
  },
  // 错误处理
  handleErr (err) {
    console.log(err)
    const errMsg = err.errMsg ? err.errMsg : ''
    const code = err.code ? err.code : null
    wx.hideLoading()
    if (errMsg) {
      if (errMsg.includes('cancel')) return 
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
    this.setData({
      imageAve: '',
      cropImageUrl: '',
      faceInfos: [],
      labels: []
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
    const { top } = wx.getMenuButtonBoundingClientRect()
    this.setData({
      safeTop: top - 7
    })
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