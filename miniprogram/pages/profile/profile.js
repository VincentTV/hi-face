// pages/profile/profile.js
Page({

  /**
   * 页面的初始数据
   */
  data: {
    userData: null
  },
  preview(e) {
    const index = e.target.dataset.index
    wx.previewImage({
      current: this.data.userData.photos[index],
      urls: this.data.userData.photos // 需要预览的图片http链接列表
    })
  },
  async showMenu (e) {
    try {
      const index = e.target.dataset.index
      const action = await wx.showActionSheet({
        itemList: ['保存到手机相册', '从云相册删除']
      })
      if (action.tapIndex === 0) {
        this.downloadImage(index)
      }
      if (action.tapIndex === 1) {
        this.deleteImage(index)
      }
    } catch (err) {
      if (err.errMsg.includes('cancel')) return
    }
    
  },
  async downloadImage (i) {
    try {
      const image = await wx.getImageInfo({
        src: this.data.userData.photos[i],
      })
      const res = await wx.saveImageToPhotosAlbum({
        filePath: image.path
      })
      wx.showToast({
        title: '保存成功!',
        duration: 2000
      })
    } catch (err) {
      if (err.errMsg.includes('cancel')) return
    }
  },
  async deleteImage (i) {
    const db = wx.cloud.database()  //获取数据库的引用
    const _ = db.command     //获取数据库查询及更新指令
    const { _id, photos } = this.data.userData
    const fileID = photos[i]
    try {
      photos.splice(i, 1)
      await db.collection('album').doc(_id).update({
        data: {
          photos: _.set(photos)
        }
      })
      await wx.cloud.deleteFile({
        fileList: [fileID]
      })
      this.setData({
        'userData.photos': photos
      })
      wx.showToast({
        title: '删除成功！',
        duration: 2000
      })
    } catch(err) {
      wx.showToast({
        title: '删除失败，请重试',
        icon: 'none',
        duration: 2000
      })
    }
      
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
  onShow: async function () {
    const db = wx.cloud.database()  //获取数据库的引用
    const res = await db.collection('album').get()
    if (res.data.length) {
      this.setData({ userData: res.data[0] })
    }
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