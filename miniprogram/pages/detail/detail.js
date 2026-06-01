const { getDetail, removeItem, getList } = require('../utils/db')
const { formatTime: _formatTime } = require('../utils/util')
const db = wx.cloud.database()

// URL参数名 → { 数据库集合, 标题 }
const COLLECTION_MAP = {
  xianzhi: { collection: 'items', title: '闲置物品' },
  items: { collection: 'items', title: '闲置物品' },
  work: { collection: 'jobs', title: '兼职' },
  jobs: { collection: 'jobs', title: '兼职' },
  lost: { collection: 'lost', title: '失物详情' },
  found: { collection: 'found', title: '拾物详情' },
  biaobai: { collection: 'confessions', title: '表白详情' },
  confessions: { collection: 'confessions', title: '表白详情' },
  food: { collection: 'food', title: '美食推荐' },
  amusement: { collection: 'entertainment', title: '观影娱乐' },
  entertainment: { collection: 'entertainment', title: '观影娱乐' },
  travel: { collection: 'travel', title: '旅游攻略' },
  rent: { collection: 'rentals', title: '房屋租售' },
  rentals: { collection: 'rentals', title: '房屋租售' },
  story: { collection: 'story', title: '桂乡故事' }
}

Page({
  data: {
    loading: true,
    item: null,
    comments: [],
    commentText: '',
    commentLoading: false
  },

  onLoad(options) {
    const name = options.name || 'items'
    const id = options.id
    const config = COLLECTION_MAP[name] || COLLECTION_MAP.xianzhi

    wx.setNavigationBarTitle({ title: config.title })
    this.setData({ loading: true, type: name, postCollection: config.collection, postId: id })

    getDetail({ collection: config.collection, id })
      .then(data => {
        this.setData({ item: data, loading: false })
      })
      .catch(err => {
        wx.showToast({ title: '获取详情失败', icon: 'none' })
        this.setData({ loading: false })
      })

    this.loadComments()
  },

  loadComments() {
    const { postCollection, postId } = this.data
    if (!postCollection || !postId) return
    this.setData({ commentLoading: true })
    getList({
      collection: 'comments',
      pageSize: 50,
      where: { postCollection, postId },
      orderBy: { field: 'createTime', direction: 'desc' }
    }).then(res => {
      // 加载用户信息（头像昵称）
      const openid = wx.getStorageSync('openid')
      this.setData({ comments: res.data, commentLoading: false })
    }).catch(err => {
      console.error('加载评论失败', err)
      this.setData({ commentLoading: false })
    })
  },

  onCommentInput(e) {
    this.setData({ commentText: e.detail.value })
  },

  submitComment() {
    const content = this.data.commentText
    if (!content || !content.trim()) {
      wx.showToast({ icon: 'none', title: '请输入评论内容' })
      return
    }
    wx.getStorage({
      key: 'openid',
      success: (res) => {
        const openid = res.data
        wx.getStorage({
          key: 'userInfo',
          success: (infoRes) => {
            const userInfo = infoRes.data || {}
            db.collection('comments').add({
              data: {
                postCollection: this.data.postCollection,
                postId: this.data.postId,
                content: content.trim(),
                _openid: openid,
                nickName: userInfo.nickName || '匿名',
                avatarUrl: userInfo.avatarUrl || '',
                createTime: new Date()
              }
            }).then(() => {
              wx.showToast({ title: '评论成功哒！', icon: 'none' })
              this.setData({ commentText: '' })
              this.loadComments()
            }).catch(err => {
              wx.showToast({ title: '评论失败', icon: 'none' })
              console.error('评论失败', err)
            })
          },
          fail: () => {
            // 没有userInfo也能发
            db.collection('comments').add({
              data: {
                postCollection: this.data.postCollection,
                postId: this.data.postId,
                content: content.trim(),
                _openid: openid,
                nickName: '匿名',
                avatarUrl: '',
                createTime: new Date()
              }
            }).then(() => {
              wx.showToast({ title: '评论成功哒！', icon: 'none' })
              this.setData({ commentText: '' })
              this.loadComments()
            })
          }
        })
      },
      fail: () => {
        wx.showToast({ icon: 'none', title: '请先登录' })
      }
    })
  },

  previewImg(e) {
    const imgData = e.currentTarget.dataset.img
    wx.previewImage({
      current: imgData,
      urls: this.data.item.fileIDs
    })
  },

  copyCall(e) {
    const phone = e.currentTarget.dataset.phone || this.data.item.pCall
    wx.setClipboardData({
      data: phone,
      success() {
        wx.showToast({ title: '电话已复制', icon: 'none' })
      }
    })
  },

  copyWechat(e) {
    const wechat = e.currentTarget.dataset.wechat || this.data.item.pWechat
    wx.setClipboardData({
      data: wechat,
      success() {
        wx.showToast({ title: '微信已复制', icon: 'none' })
      }
    })
  },

  deleteItem() {
    const item = this.data.item
    if (!item) return

    wx.getStorage({
      key: 'openid',
      success: res => {
        const openid = res.data
        if (openid !== item._openid) {
          wx.showToast({ title: '只能删除自己的发布', icon: 'none' })
          return
        }
        wx.showModal({
          title: '提示',
          content: '确定要删哒？',
          success: modalRes => {
            if (modalRes.confirm) {
              const name = this.data.type || 'items'
              const config = COLLECTION_MAP[name] || COLLECTION_MAP.xianzhi
              removeItem({ collection: config.collection, id: item._id })
                .then(() => {
                  wx.showToast({ title: '删哒！', icon: 'none' })
                  wx.navigateBack()
                })
                .catch(err => {
                  wx.showToast({ title: '删冇得…再试试', icon: 'none' })
                })
            }
          }
        })
      },
      fail: () => {
        wx.showToast({ title: '你还未登录', icon: 'none' })
      }
    })
  },

  formatTime(date) {
    return _formatTime(date)
  },

  formatCommentTime(date) {
    if (!date) return ''
    const d = new Date(date)
    const now = Date.now()
    const diff = now - d.getTime()
    if (diff < 60000) return '刚刚'
    if (diff < 3600000) return Math.floor(diff / 60000) + '分钟前'
    if (diff < 86400000) return Math.floor(diff / 3600000) + '小时前'
    return _formatTime(date)
  },

  onShareAppMessage() {
    const item = this.data.item
    const name = item ? (item.name || item.title || item.gangwei || item.to || '桂乡生活') : '桂乡生活'
    return {
      title: name + ' · 桂乡生活',
      path: this.route
    }
  }
})
