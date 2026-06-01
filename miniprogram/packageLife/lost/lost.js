const auth = require('../../pages/utils/auth')
const { removeItem, getList } = require('../../pages/utils/db')

Page({
  data: {
    page: 0,          // tab index (0=lost, 1=found)
    isSend: false,
    loading: false,
    pageSize: 10,
    lostPage: 0,
    lostHasMore: true,
    lostLoading: false,
    foundPage: 0,
    foundHasMore: true,
    foundLoading: false,
    dataList: [],
    foundList: [],
    openid: null
  },

  onLoad(e) {
    wx.getStorage({
      key: 'openid',
      success: (res) => {
        this.setData({ openid: res.data })
      },
    })
    this.loadLostData()
    this.loadFoundData()
  },

  onShow() {
    this.setData({ isSend: false })
    this.loadLostData(true)
    this.loadFoundData(true)
  },

  loadLostData(isRefresh = false) {
    if (isRefresh) {
      this.setData({ lostPage: 0, lostHasMore: true })
    }
    if (!this.data.lostHasMore || this.data.lostLoading) return
    this.setData({ loading: true, lostLoading: true })
    getList({
      collection: 'lost',
      page: this.data.lostPage,
      pageSize: this.data.pageSize
    }).then(res => {
      const dataList = this.data.lostPage === 0
        ? res.data
        : [...this.data.dataList, ...res.data]
      this.setData({
        dataList,
        lostPage: this.data.lostPage + 1,
        lostHasMore: res.hasMore,
        loading: false,
        lostLoading: false
      })
    }).catch(err => {
      console.error("请求失败", err)
      this.setData({ loading: false, lostLoading: false })
    })
  },

  loadFoundData(isRefresh = false) {
    if (isRefresh) {
      this.setData({ foundPage: 0, foundHasMore: true })
    }
    if (!this.data.foundHasMore || this.data.foundLoading) return
    this.setData({ loading: true, foundLoading: true })
    getList({
      collection: 'found',
      page: this.data.foundPage,
      pageSize: this.data.pageSize
    }).then(res => {
      const foundList = this.data.foundPage === 0
        ? res.data
        : [...this.data.foundList, ...res.data]
      this.setData({
        foundList,
        foundPage: this.data.foundPage + 1,
        foundHasMore: res.hasMore,
        loading: false,
        foundLoading: false
      })
    }).catch(err => {
      console.error("请求失败", err)
      this.setData({ loading: false, foundLoading: false })
    })
  },

  deleteLostItem(e) {
    const item = e.currentTarget.dataset.t
    removeItem({ collection: 'lost', id: item._id }).then(() => {
      wx.showToast({ icon: 'success', title: '删哒！' })
      const dataList = [...this.data.dataList]
      const idx = dataList.findIndex(i => i._id === item._id)
      if (idx !== -1) {
        dataList.splice(idx, 1)
        this.setData({ dataList })
      }
    }).catch(err => {
      console.error('删除失败', err)
      wx.showToast({ icon: 'none', title: '删冇得…再试试' })
    })
  },

  deleteFoundItem(e) {
    const item = e.currentTarget.dataset.t
    removeItem({ collection: 'found', id: item._id }).then(() => {
      wx.showToast({ icon: 'success', title: '删哒！' })
      const foundList = [...this.data.foundList]
      const idx = foundList.findIndex(i => i._id === item._id)
      if (idx !== -1) {
        foundList.splice(idx, 1)
        this.setData({ foundList })
      }
    }).catch(err => {
      console.error('删除失败', err)
      wx.showToast({ icon: 'none', title: '删冇得…再试试' })
    })
  },

  onReachBottom() {
    if (this.data.page === 0) {
      this.loadLostData()
    } else {
      this.loadFoundData()
    }
  },

  onPullDownRefresh() {
    if (this.data.page === 0) {
      this.loadLostData(true)
    } else {
      this.loadFoundData(true)
    }
    wx.stopPullDownRefresh()
  },

  // 复制电话
  copyPhone(e) {
    const item = e.currentTarget.dataset.call
    wx.setClipboardData({
      data: item.pCall,
      success() {
        wx.showToast({ title: '电话已经复制' })
      },
      fail() {
        wx.showToast({ icon: 'none', title: '该用户没有输入手机号码!' })
      }
    })
  },

  // 复制微信
  copyWechat(e) {
    const item = e.currentTarget.dataset.wechat
    wx.setClipboardData({
      data: item.pWechat,
      success() {
        wx.showToast({ title: '微信号已经复制' })
      },
      fail() {
        wx.showToast({ icon: 'none', title: '该用户没有输入微信号' })
      }
    })
  },

  // 预览图片
  previewImg(e) {
    const imgData = e.currentTarget.dataset.img;
    wx.previewImage({
      current: imgData[0],
      urls: imgData[1]
    })
  },

  // 打开发布分类
  send() {
    auth.checkLogin().then(res => {
      if (res) {
        this.setData({ isSend: true })
      }
    })
  },

  // 退出分类
  back() {
    this.setData({ isSend: false, isCall: false })
  },

  // 跳转失物发布
  goSendLost() {
    wx.navigateTo({ url: '../../packageService/publish/publish?name=lostlost' })
  },

  // 跳转拾物发布
  goSendFound() {
    wx.navigateTo({ url: '../../packageService/publish/publish?name=lostfound' })
  },

  // 滚动切换标签
  switchTab(e) {
    this.setData({ page: e.detail.current })
  },

  // 点击标题切换
  switchNav(e) {
    const page = e.target.dataset.page;
    if (this.data.page !== page) {
      this.setData({ page })
    }
  },

  onShareAppMessage() {
    return {
      title: '桂乡生活 · 咸宁失物招领',
      path: this.route
    }
  },

  goLostDetail(e) {
    const item = e.currentTarget.dataset.id
    wx.navigateTo({
      url: '../../pages/detail/detail?name=lost&id=' + item._id
    })
  },

  goFoundDetail(e) {
    const item = e.currentTarget.dataset.id
    wx.navigateTo({
      url: '../../pages/detail/detail?name=found&id=' + item._id
    })
  }
})
