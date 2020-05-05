// components/cover/cover.js
const app = getApp()
Component({
  /**
   * 组件的属性列表
   */
  properties: {
    showCover: Boolean,
    renderedPath: String,
    isVerified: Boolean
  },

  /**
   * 组件的初始数据
   */
  data: {
    isDownloaded: false,
    pass: true,
    cloudPath: '',
    fileID: ''
  },

  /**
   * 组件的方法列表
   */
  methods: {
    hideCover() {
      this.setData({
        showCover: false
      })
      wx.showTabBar({ aniamtion: true })
    },
    preview: function () {
      wx.previewImage({
        urls: [this.data.renderedPath]
      })
    },
    upload: async function (e) {
      if (e.detail.errMsg.includes('fail')) {
        wx.showToast({
          title: '允许授权才能上传云相册喔～',
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
      try {
        wx.showLoading({
          title: '上传图片中'
        })
        // 上传图片
        this.data.cloudPath = `album/${Date.now()}-${Math.floor(Math.random(0, 1) * 1000)}` + this.data.renderedPath.match(/\.[^.]+?$/)
        const file = await wx.cloud.uploadFile({
          cloudPath: this.data.cloudPath,
          filePath: this.data.renderedPath
        })
        this.data.fileID = file.fileID
        // 图片安全审核
        if (this.data.isVerified) {
          this.updateDb()
        } else {
          this.verityImage()
        }
      } catch (err) {
        wx.showToast({
          title: '上传图片失败，请重试',
          icon: 'none',
          duration: 2000
        })
      }
    },
    async verityImage () {
      // 图片安全审核
      const verify = await wx.cloud.callFunction({
        name: 'image-verify',
        data: {
          cloudPath: this.data.cloudPath
        }
      })
      const { PornInfo, TerroristInfo, PoliticsInfo } = verify.result
      if (PornInfo.Score < 90 && TerroristInfo.Score < 90 && PoliticsInfo.Score < 90) {
        this.updateDb()
      } else {
        wx.hideLoading()
        wx.showToast({
          title: '图片审核未通过',
          icon: 'none',
          duration: 4000
        })
        this.setData({
          pass: false
        })
        await wx.cloud.deleteFile({
          fileList: [this.data.fileID]
        })
      }
    },
    async updateDb () {
      const userData = await this.checkUser()
      const db = wx.cloud.database()  //获取数据库的引用
      const _ = db.command     //获取数据库查询及更新指令
      const _id = userData._id
      const res = await db.collection('album').doc(_id).update({
        data: {
          photos: _.push(this.data.fileID)
        }
      })
      if (res.errMsg.includes('ok')) {
        wx.hideLoading()
        wx.showToast({
          title: '上传图片成功',
          duration: 1500
        })
        wx.switchTab({
          url: '/pages/profile/profile',
        })
        this.setData({ showCover: false })
        wx.showTabBar({ aniamtion: true })
      }
    },
    async checkUser () {
      const db = wx.cloud.database()  //获取数据库的引用
      const userData = await db.collection('album').get()

      //如果当前用户的数据data数组的长度为0，说明数据库里没有当前用户的数据
      if (userData.data.length === 0) {
        //没有当前用户的数据，那就新建一个数据框架，其中_id和_openid会自动生成
        return await db.collection('album').add({
          data: {
            //nickName和avatarUrl可以通过getUserInfo来获取，这里不多介绍
            "nickName": app.globalData.userInfo.nickName,
            "photos": [],
          }
        })
      } else {
        return userData.data[0]
      }
    }
  }
})
