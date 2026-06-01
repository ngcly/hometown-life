const auth = require('../../pages/utils/auth.js')
const dbUtil = require('../../pages/utils/db.js')
const util = require('../../pages/utils/util.js');
const db = wx.cloud.database()

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
    if (!this.data.hasMore || this.data.loading) return
    this.setData({ loading: true })

    const { page, pageSize } = this.data
    dbUtil.getList({ collection: 'rentals', page, pageSize })
      .then((res) => {
        if (page === 0) {
          this.setData({ dataList: res.data })
        } else {
          this.setData({ dataList: [...this.data.dataList, ...res.data] })
        }
        this.setData({ loading: false, hasMore: res.hasMore })
      })
      .catch((err) => {
        console.error('请求失败', err)
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

  onShow() {
    this.loadData(true)
  },

  /* ---- 表单输入 ---- */
  onTitleInput(e) { this.setData({ title: e.detail.value }) },
  onLayoutInput(e) { this.setData({ huxing: e.detail.value }) },
  onAreaInput(e) { this.setData({ mianji: e.detail.value }) },
  onPriceInput(e) { this.setData({ price: e.detail.value }) },
  onLocationInput(e) { this.setData({ weizhi: e.detail.value }) },
  onContactInput(e) { this.setData({ lianxiren: e.detail.value }) },
  onPhoneInput(e) { this.setData({ dianhua: e.detail.value }) },
  onInfoInput(e) { this.setData({ info: e.detail.value }) },

  /* ---- 打开/关闭发布弹窗 ---- */
  send() {
    auth.checkLogin().then((isLoggedIn) => {
      if (isLoggedIn) {
        wx.getStorage({
          key: 'userInfo',
          success: (res) => { this.setData({ pName: res.data.nickName || '' }) }
        })
        this.setData({ isSend: true })
      }
    })
  },

  close() {
    this.setData({ isSend: false })
  },

  /* ---- 发布 ---- */
  publish() {
    const title = this.data.title
    if (!title) {
      wx.showToast({ icon: "none", title: '请填写房源标题' })
      return
    }

    wx.showLoading({ title: '桂香送信中...' })
    db.collection('rentals').add({
      data: {
        title,
        huxing: this.data.huxing || '',
        mianji: this.data.mianji || '',
        price: this.data.price || '',
        weizhi: this.data.weizhi || '',
        lianxiren: this.data.lianxiren || '',
        dianhua: this.data.dianhua || '',
        info: this.data.info || '',
        pName: this.data.pName || '',
        sendTime: util.formatTime(new Date()),
        createTime: new Date()
      }
    }).then(res => {
      wx.hideLoading()
      wx.showToast({ title: '房源发布成功哒！' })
      this.setData({
        isSend: false,
        title: null, huxing: null, mianji: null,
        price: null, weizhi: null,
        lianxiren: null, dianhua: null, info: null
      })
      this.loadData(true)
    }).catch(err => {
      wx.hideLoading()
      wx.showToast({ icon: 'none', title: '桂花信使迷路了…' })
      console.error('发布失败', err)
    })
  },

  /* ---- 删除 ---- */
  deleteItem(e) {
    const item = e.currentTarget.dataset.t
    dbUtil.removeItem({ collection: 'rentals', id: item._id })
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

  /* ---- 跳转详情 ---- */
  goDetail(e) {
    const item = e.currentTarget.dataset.id
    wx.navigateTo({
      url: '../../pages/detail/detail?name=rent&id=' + item._id
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
      title: '桂乡生活 · 咸宁房屋租售',
      path: this.route
    }
  }
})
