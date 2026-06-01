const auth = require('../../pages/utils/auth.js')
const dbUtil = require('../../pages/utils/db.js')
const util = require('../../pages/utils/util.js');

Page({
  data: {
    isSend: false,
    loading: false,
    loadError: false,
    page: 0,
    pageSize: 10,
    hasMore: true,
    dataList: [],
    openid: null
  },

  loadData(isRefresh = false) {
    if (isRefresh) {
      this.setData({ page: 0, hasMore: true, loadError: false })
    }
    this.setData({ loading: true })

    const { page, pageSize } = this.data
    dbUtil.getList({ collection: 'confessions', page, pageSize })
      .then((res) => {
        if (page === 0) {
          this.setData({ dataList: res.data })
        } else {
          this.setData({ dataList: [...this.data.dataList, ...res.data] })
        }
        this.setData({ loading: false, hasMore: res.hasMore })
      })
      .catch((err) => {
        console.error("请求失败", err)
        this.setData({ loading: false, loadError: true })
      })
  },

  onLoad(options) {
    wx.getStorage({
      key: 'openid',
      success: (res) => { this.setData({ openid: res.data }) },
    })
    this.loadData(true)
  },

  /* ---- 表单输入 ---- */
  onRecipientInput(e) { this.setData({ to: e.detail.value }) },
  onWriterInput(e) { this.setData({ writer: e.detail.value }) },
  onContentInput(e) { this.setData({ info: e.detail.value }) },

  /* ---- 打开/关闭弹窗 ---- */
  send() {
    auth.checkLogin().then((isLoggedIn) => {
      if (isLoggedIn) {
        this.setData({ isSend: true })
      }
    })
  },

  close() {
    this.setData({ isSend: false })
  },

  /* ---- 发布 ---- */
  publish() {
    const writer = this.data.writer
    const to = this.data.to
    const info = this.data.info

    if (!to) {
      wx.showToast({ icon: "none", title: '对象不能为空' })
      return
    }
    if (!writer) {
      wx.showToast({ icon: "none", title: '称呼不能为空' })
      return
    }
    if (!info || info.length < 6) {
      wx.showToast({ icon: "none", title: '内容要多于六个字' })
      return
    }

    wx.showLoading({ title: '桂香送信中...' })
    wx.cloud.callFunction({
      name: 'confession',
      data: {
        info, to, writer,
        sendTime: util.formatTime(new Date())
      },
      success: res => {
        wx.hideLoading()
        wx.showToast({ title: '表白送出去哒！' })
        this.setData({ isSend: false, to: null, writer: null, info: null })
        this.loadData(true)
      },
      fail: err => {
        wx.hideLoading()
        wx.showToast({ icon: 'none', title: '桂花信使迷路了…' })
        console.error('发布失败', err)
      }
    })
  },

  deleteItem(e) {
    const item = e.currentTarget.dataset.t
    dbUtil.removeItem({ collection: 'confessions', id: item._id })
      .then(() => {
        wx.showToast({ icon: 'success', title: '删哒！' })
        const dataList = [...this.data.dataList]
        const index = dataList.findIndex(i => i._id === item._id)
        if (index !== -1) {
          dataList.splice(index, 1)
          this.setData({ dataList })
        }
      })
      .catch((err) => { console.error('删除失败', err) })
  },

  goDetail(e) {
    const item = e.currentTarget.dataset.id
    wx.navigateTo({
      url: '../../pages/detail/detail?name=biaobai&id=' + item._id
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
