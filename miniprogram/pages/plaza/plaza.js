const { getList, removeItem } = require('../utils/db')
const auth = require('../utils/auth')

// 广场信息类型
const CONTENT_TYPES = [
  { key: 'all', label: '全部', icon: '✨' },
  { key: 'xianzhi', label: '闲置', icon: '📦' },
  { key: 'lost', label: '失物', icon: '🔍' },
  { key: 'zufang', label: '房屋', icon: '🏠' },
  { key: 'jianzhi', label: '兼职', icon: '💼' },
  { key: 'biaobai', label: '交友', icon: '💕' },
  { key: 'food', label: '美食', icon: '🍜' },
  { key: 'story', label: '故事', icon: '📖' },
  { key: 'travel', label: '旅游', icon: '🏔️' },
  { key: 'amusement', label: '娱乐', icon: '🎬' },
]

// 类型 → 数据库集合 映射
const TYPE_COLLECTION = {
  xianzhi: 'items',
  lost: 'lost',
  zufang: 'rentals',
  jianzhi: 'jobs',
  biaobai: 'confessions',
  food: 'food',
  story: 'story',
  travel: 'travel',
  amusement: 'entertainment'
}

// 类型 → 详情页 name 参数 映射
const TYPE_DETAIL_NAME = {
  xianzhi: 'xianzhi',
  lost: 'lost',
  zufang: 'rent',
  jianzhi: 'work',
  biaobai: 'confessions',
  food: 'food',
  story: 'story',
  travel: 'travel',
  amusement: 'entertainment'
}

// 类型标签配色
const TYPE_LABEL_COLORS = {
  xianzhi: '#E8A33D',
  lost: '#EF4444',
  zufang: '#F5A623',
  jianzhi: '#F59E0B',
  biaobai: '#EC4899',
  food: '#F97316',
  story: '#EC4899',
  travel: '#14B8A6',
  amusement: '#A855F7'
}

// "全部"模式下，每个集合取前 N 条
const ALL_MODE_PER_COLLECTION = 4

Page({
  data: {
    types: CONTENT_TYPES,
    currentType: 'all',
    dataList: [],
    loading: false,
    loadError: false,
    page: 0,
    pageSize: 10,
    hasMore: true,
    openid: null,
    isAllMode: true  // 全部模式（混排，不支持分页）/ 单类型模式
  },

  onLoad(options) {
    wx.getStorage({
      key: 'openid',
      success: (res) => { this.setData({ openid: res.data }) },
    })
    this.loadData()
  },

  onShow() {
    if (this.data.currentType === 'all') {
      this.loadMixedFeed(true)
    } else {
      this.loadData(true)
    }
  },

  /* ---- 切换类型 ---- */
  switchType(e) {
    const type = e.currentTarget.dataset.type
    if (type === this.data.currentType) return

    this.setData({
      currentType: type,
      dataList: [],
      page: 0,
      hasMore: true,
      loadError: false,
      isAllMode: type === 'all'
    })

    if (type === 'all') {
      this.loadMixedFeed(true)
    } else {
      this.loadData(true)
    }
  },

  /* ---- 全部模式：加载各集合最新数据混排 ---- */
  async loadMixedFeed(isRefresh) {
    if (isRefresh) this.setData({ loading: true, loadError: false })

    try {
      const promises = Object.entries(TYPE_COLLECTION).map(([key, collection]) =>
        getList({ collection, pageSize: ALL_MODE_PER_COLLECTION, page: 0 })
          .then(res => res.data.map(item => ({
            ...item,
            _type: key,
            _label: CONTENT_TYPES.find(t => t.key === key)?.label || key,
            _color: TYPE_LABEL_COLORS[key] || '#999'
          })))
          .catch(() => [])
      )

      const results = await Promise.all(promises)
      let merged = results.flat()

      // 按 createTime 降序排列
      merged.sort((a, b) => {
        const tA = a.createTime ? new Date(a.createTime).getTime() : 0
        const tB = b.createTime ? new Date(b.createTime).getTime() : 0
        return tB - tA
      })

      this.setData({
        dataList: merged.slice(0, 30),
        loading: false,
        hasMore: false  // 全部模式不支持翻页
      })
    } catch (err) {
      console.error('加载广场数据失败', err)
      this.setData({ loading: false, loadError: true })
    }
  },

  /* ---- 单类型模式：分页加载 ---- */
  loadData(isRefresh) {
    if (isRefresh) {
      this.data.page = 0
      this.data.hasMore = true
      this.data.loadError = false
    }
    if (!this.data.hasMore || this.data.loading) return

    this.setData({ loading: true })
    const { page, pageSize, currentType } = this.data
    const collection = TYPE_COLLECTION[currentType]
    if (!collection) return

    getList({ collection, pageSize, page })
      .then((res) => {
        const tagged = res.data.map(item => ({
          ...item,
          _type: currentType,
          _label: CONTENT_TYPES.find(t => t.key === currentType)?.label || currentType,
          _color: TYPE_LABEL_COLORS[currentType] || '#999'
        }))
        const newList = page === 0 ? tagged : this.data.dataList.concat(tagged)
        this.setData({
          dataList: newList,
          hasMore: res.hasMore,
          loading: false
        })
      })
      .catch((err) => {
        console.error('请求失败', err)
        this.setData({ loading: false, loadError: true })
      })
  },

  /* ---- 删除 ---- */
  delete: function(e) {
    const info = e.currentTarget.dataset.t
    const collection = TYPE_COLLECTION[info._type] || 'items'

    removeItem({ collection, id: info._id }).then(() => {
      const newList = this.data.dataList.filter(item => item._id !== info._id)
      this.setData({ dataList: newList })
      wx.showToast({ icon: 'success', title: '删哒！' })
    }).catch(() => {
      wx.showToast({ icon: 'none', title: '删冇得…再试试' })
    })
  },

  /* ---- 发布（弹出选择类型） ---- */
  send: function() {
    auth.checkLogin().then((loggedIn) => {
      if (!loggedIn) return

      const publishTypes = [
        { label: '发布闲置', url: '../packageService/publish/publish?name=xianzhi' },
        { label: '发布失物', url: '../packageService/publish/publish?name=lostlost' },
        { label: '发布拾物', url: '../packageService/publish/publish?name=lostfound' }
      ]

      wx.showActionSheet({
        itemList: publishTypes.map(t => t.label),
        success: (res) => {
          wx.navigateTo({ url: publishTypes[res.tapIndex].url })
        }
      })
    })
  },

  /* ---- 跳转详情 ---- */
  go: function(event) {
    const info = event.currentTarget.dataset.id
    const detailName = TYPE_DETAIL_NAME[info._type] || 'items'
    wx.navigateTo({
      url: '../detail/detail?name=' + detailName + '&id=' + info._id,
    })
  },

  /* ---- 预览大图 ---- */
  previewImage(e) {
    const src = e.currentTarget.dataset.src
    const urls = e.currentTarget.dataset.urls || [src]
    wx.previewImage({ urls, current: src })
  },

  onPullDownRefresh() {
    if (this.data.currentType === 'all') {
      this.loadMixedFeed(true)
    } else {
      this.loadData(true)
    }
    wx.stopPullDownRefresh()
  },

  onReachBottom() {
    if (this.data.isAllMode) return  // 全部模式不分页
    if (!this.data.hasMore || this.data.loading) return
    this.data.page++
    this.loadData()
  },

  onShareAppMessage() {
    return {
      title: '桂乡生活 · 咸宁信息广场',
      path: this.route
    }
  }
})
