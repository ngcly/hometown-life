const { getList, removeItem } = require('../../pages/utils/db')
const auth = require('../../pages/utils/auth')

Page({

  data: {
    page: 0,
    pageSize: 10,
    hasMore: true,
    loading: false,
    dataList: [],
    openid: null
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
    getList({
      collection: 'jobs',
      page: this.data.page,
      pageSize: this.data.pageSize
    }).then(res => {
      const newList = isRefresh ? res.data : this.data.dataList.concat(res.data)
      this.setData({
        dataList: newList,
        hasMore: res.hasMore,
        loading: false
      })
    }).catch(err => {
      console.error('请求失败', err)
      this.setData({ loading: false })
    })
  },

  onLoad(options) {
    wx.getStorage({
      key: 'openid',
      success: (res) => {
        this.setData({ openid: res.data })
      }
    })
    this.loadData()
  },

  goDetail(e) {
    const item = e.currentTarget.dataset.id
    wx.navigateTo({
      url: '../../pages/detail/detail?name=work&id=' + item._id,
    })
  },

  deleteItem(e) {
    const item = e.currentTarget.dataset.t
    auth.checkLogin().then((loggedIn) => {
      if (!loggedIn) return
      removeItem({ collection: 'jobs', id: item._id }).then(() => {
        wx.showToast({ icon: 'success', title: '删哒！' })
        const list = this.data.dataList
        const index = list.findIndex(i => i._id === item._id)
        if (index > -1) {
          list.splice(index, 1)
          this.setData({ dataList: list })
        }
      }).catch(err => {
        console.error('删除失败', err)
        wx.showToast({ icon: 'none', title: '删冇得…再试试' })
      })
    })
  },

  onReachBottom() {
    if (!this.data.hasMore || this.data.loading) return
    this.setData({ page: this.data.page + 1 })
    this.loadData()
  },

  onPullDownRefresh() {
    this.loadData(true)
    wx.stopPullDownRefresh()
  },

  onShareAppMessage() {
    return {
      title: '桂乡生活 · 咸宁人的本地生活圈',
      path: this.route
    }
  }
})
