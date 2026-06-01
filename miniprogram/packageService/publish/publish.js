const app = getApp()
const util = require('../../pages/utils/util.js');
const db = wx.cloud.database();

Page({
  data: {
    imgbox: [],
    fileIDs: [],
    categoryList: ['电子产品', '家居家具', '服饰美妆', '书籍文具', '其他'],
  },

  onLoad(options) {
    this.setData({ type: options.name })
    if (this.data.type === 'lostlost' || this.data.type === 'lostfound') {
      wx.setNavigationBarTitle({ title: '失物招领' })
    } else {
      wx.setNavigationBarTitle({ title: '闲置发布' })
    }
    wx.getStorage({
      key: 'userInfo',
      success: (res) => { this.setData({ user: res.data }) },
    })
  },

  /* ---- 表单输入 ---- */
  onNameInput(e) { this.setData({ pName: e.detail.value }) },
  onPhoneInput(e) { this.setData({ pCall: e.detail.value }) },
  onWechatInput(e) { this.setData({ pWechat: e.detail.value }) },
  onItemNameInput(e) { this.setData({ name: e.detail.value }) },
  onCategoryChange(e) {
    this.setData({ category: this.data.categoryList[e.detail.value] })
  },
  onPriceInput(e) { this.setData({ price: e.detail.value }) },
  onInfoInput(e) { this.setData({ info: e.detail.value }) },

  /* ---- 删除照片 ---- */
  deleteImage(e) {
    const index = e.currentTarget.dataset.deindex;
    const imgbox = this.data.imgbox;
    imgbox.splice(index, 1)
    this.setData({ imgbox })
  },

  /* ---- 选择图片 ---- */
  pickImage() {
    const imgbox = this.data.imgbox;
    let count = 5;
    if (imgbox.length > 0 && imgbox.length < 5) {
      count = 5 - imgbox.length;
    } else if (imgbox.length === 5) {
      count = 1;
    }
    wx.chooseImage({
      count,
      sizeType: ['original', 'compressed'],
      sourceType: ['album', 'camera'],
      success: (res) => {
        const tempFilePaths = res.tempFilePaths
        let newImgbox = imgbox
        if (imgbox.length === 0) {
          newImgbox = tempFilePaths
        } else if (5 > imgbox.length) {
          newImgbox = imgbox.concat(tempFilePaths);
        }
        this.setData({ imgbox: newImgbox })
      }
    })
  },

  /* ---- 发布 ---- */
  publish() {
    let room
    if (this.data.type === 'lostlost') {
      room = 'lost'
    } else if (this.data.type === 'lostfound') {
      room = 'found'
    } else {
      room = 'items'
    }

    if (!this.data.imgbox.length) {
      wx.showToast({ icon: 'none', title: '请选择图片' })
      return
    }

    // 上传图片到云存储
    wx.showLoading({ title: '上传中' })
    const promiseArr = []
    for (let i = 0; i < this.data.imgbox.length; i++) {
      promiseArr.push(new Promise((resolve, reject) => {
        const item = this.data.imgbox[i];
        const suffix = /\.\w+$/.exec(item)[0];
        wx.cloud.uploadFile({
          cloudPath: new Date().getTime() + suffix,
          filePath: item,
          success: res => {
            this.setData({
              fileIDs: this.data.fileIDs.concat(res.fileID)
            });
            resolve();
          },
          fail: () => {
            wx.hideLoading();
            wx.showToast({ icon: 'none', title: "上传失败" })
            reject(new Error('上传失败'))
          }
        })
      }))
    }

    Promise.all(promiseArr).then(() => {
      wx.cloud.callFunction({
        name: 'publish',
        data: {
          room,
          fileIDs: this.data.fileIDs,
          sendTime: util.formatTime(new Date()),
          category: this.data.category || '',
          pName: this.data.pName,
          pCall: this.data.pCall,
          pWechat: this.data.pWechat,
          name: this.data.name,
          price: this.data.price,
          info: this.data.info,
          images: this.data.imgbox,
          touxiang: this.data.user.avatarUrl,
          userName: this.data.user.nickName
        },
        success: () => {
          wx.showToast({ title: '发布成功哒！' })
          wx.navigateBack()
        },
        fail: (err) => {
          wx.showToast({ icon: 'none', title: '桂花信使迷路了…' })
          console.error('发布失败', err)
        }
      })
    })
  },

  onShareAppMessage() {
    return {
      title: '桂乡生活 · 发布信息',
      path: this.route
    }
  },
})
