const dbUtil = require('../../pages/utils/db.js')
const auth = require('../../pages/utils/auth.js')

Page({

  data: {
    imgbox: [],
    page: 0,
    pageSize: 10,
    hasMore: true,
    loading: false,
    dataList: [],
    openid: null
  },

  onLoad(options) {
    wx.getStorage({
      key: 'openid',
      success: (res) => {
        this.setData({ openid: res.data })
      },
    })
    this.loadData(true)
  },

  /**
   * 加载分页数据
   * @param {boolean} isRefresh - 是否刷新（重置页码）
   */
  loadData(isRefresh = false) {
    if (isRefresh) {
      this.setData({ page: 0, hasMore: true })
    }
    if (!this.data.hasMore || this.data.loading) return
    this.setData({ loading: true })
    dbUtil.getList({ collection: 'items', page: this.data.page, pageSize: this.data.pageSize })
      .then((res) => {
        const newList = this.data.page === 0 ? res.data : this.data.dataList.concat(res.data)
        this.setData({
          dataList: newList,
          hasMore: res.hasMore,
          loading: false
        })
      })
      .catch((err) => {
        console.error("请求失败", err)
        this.setData({ loading: false })
      })
  },

  deleteItem(e) {
    const item = e.currentTarget.dataset.t
    dbUtil.removeItem({ collection: 'items', id: item._id })
      .then(() => {
        wx.showToast({ icon: 'success', title: '删哒！' })
        const list = this.data.dataList
        const idx = list.findIndex(i => i._id === item._id)
        if (idx !== -1) {
          list.splice(idx, 1)
          this.setData({ dataList: list })
        }
      })
      .catch((err) => {
        console.error("删除失败", err)
        wx.showToast({ icon: 'none', title: '删冇得…再试试' })
      })
  },

  send() {
    auth.checkLogin().then(loggedIn => {
      if (loggedIn) {
        wx.navigateTo({ url: 'publish/publish?name=xianzhi' })
      }
    })
  },

  goDetail(e) {
    const item = e.currentTarget.dataset.id
    wx.navigateTo({
      url: '../../pages/detail/detail?name=xianzhi&id=' + item._id,
    })
  },

  onShow() {
    this.loadData(true)
  },

  onPullDownRefresh() {
    this.loadData(true)
    wx.stopPullDownRefresh()
  },

  onReachBottom() {
    if (!this.data.hasMore || this.data.loading) return
    this.setData({ page: this.data.page + 1 })
    this.loadData()
  },

  onShareAppMessage() {
    return {
      title: '桂乡生活 · 咸宁人的本地生活圈',
      path: this.route
    }
  }
})
