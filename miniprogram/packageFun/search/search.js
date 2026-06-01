const { getList } = require('../../pages/utils/db')
const db = wx.cloud.database()
const _ = db.command

const COLLECTIONS = [
  { name: 'items', fields: ['name', 'info'] },
  { name: 'lost', fields: ['name', 'info'] },
  { name: 'found', fields: ['name', 'info'] },
  { name: 'jobs', fields: ['gangwei', 'neirong', 'didian'] },
  { name: 'confessions', fields: ['to', 'info'] },
]

let searchTimer = null

Page({
  data: {
    keyword: '',
    results: [],
    page: 0,
    pageSize: 10,
    hasMore: true,
    searched: false,
    loading: false,
  },

  onSearchInput(e) {
    const keyword = e.detail.value.trim()
    this.setData({ keyword })

    if (searchTimer) clearTimeout(searchTimer)

    if (!keyword) {
      this.setData({ results: [], searched: false, hasMore: true })
      return
    }

    searchTimer = setTimeout(() => this.doSearch(true), 300)
  },

  async doSearch(isRefresh) {
    const { keyword, page, pageSize } = this.data
    if (!keyword) return

    this.setData({ loading: true, searched: true })

    try {
      const pageNum = isRefresh ? 0 : page
      let allResults = []

      for (const col of COLLECTIONS) {
        const orConditions = col.fields.map(field => ({
          [field]: db.RegExp({ regexp: keyword, options: 'i' })
        }))

        try {
          const res = await getList({
            collection: col.name,
            pageSize: 5,
            page: pageNum,
            where: _.or(orConditions)
          })
          allResults.push(...res.data.map(item => ({ ...item, _col: col.name })))
        } catch (e) {
          console.error('搜索' + col.name + '失败:', e)
        }
      }

      allResults.sort((a, b) => {
        const tA = a.createTime ? new Date(a.createTime).getTime() : 0
        const tB = b.createTime ? new Date(b.createTime).getTime() : 0
        return tB - tA
      })

      this.setData({
        results: isRefresh ? allResults : [...this.data.results, ...allResults],
        hasMore: allResults.length >= pageSize,
        page: pageNum + 1,
        loading: false
      })
    } catch (e) {
      console.error('搜索失败:', e)
      this.setData({ loading: false })
    }
  },

  loadMore() {
    if (!this.data.loading && this.data.hasMore) {
      this.doSearch(false)
    }
  },

  goDetail(e) {
    const item = e.detail.item
    wx.navigateTo({
      url: '../../pages/detail/detail?name=' + item._col + '&id=' + item._id
    })
  },

  goBack() {
    wx.navigateBack()
  },

  onShareAppMessage() {
    return { title: '桂乡生活 · 搜索', path: this.route }
  }
})
