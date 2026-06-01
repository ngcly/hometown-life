const db = wx.cloud.database()

const USER_COLLECTIONS = [
  { name: 'items', label: '广场', titleKey: 'name' },
  { name: 'lost', label: '失物', titleKey: 'name' },
  { name: 'found', label: '拾物', titleKey: 'name' },
  { name: 'confessions', label: '表白', titleKey: 'to' },
  { name: 'jobs', label: '兼职', titleKey: 'gangwei' },
  { name: 'food', label: '美食', titleKey: 'name' },
  { name: 'travel', label: '旅游', titleKey: 'name' },
  { name: 'entertainment', label: '娱乐', titleKey: 'name' },
  { name: 'rentals', label: '房屋', titleKey: 'title' },
  { name: 'story', label: '故事', titleKey: 'title' }
]

Page({

  data: {
    fabu: false,
    login: false,
    nickName: '',
    avatarUrl: '',
    editingNickname: false,
    right: "../../images/right.png",
    down: "../../images/down.png",
    confessions: 0,
    items: 0,
    lost: 0,
    found: 0,
    myPosts: [],
    myPostsLoading: false,
    version: '1.0.0'
  },

  onLoad() {
    this.getOpenid()
  },

  previewImg() {
    wx.showToast({ icon: 'none', title: '意见反馈功能开发中，敬请期待' })
  },

  /** 选择微信头像 */
  onChooseAvatar(e) {
    const avatarUrl = e.detail.avatarUrl || ''
    this.setData({ avatarUrl })
    this._saveUserInfo()
  },

  /** 输入微信昵称 */
  onNicknameInput(e) {
    const nickName = e.detail.value || ''
    if (nickName) {
      this.setData({ nickName, editingNickname: false })
      this._saveUserInfo()
    }
  },

  /** 开始编辑昵称 */
  startEditNickname() {
    this.setData({ editingNickname: true })
  },

  /** 结束编辑（失焦时，如果没输入就恢复显示） */
  finishEditNickname(e) {
    const nickName = e.detail.value || ''
    if (nickName) {
      this.setData({ nickName, editingNickname: false })
      this._saveUserInfo()
    } else {
      this.setData({ editingNickname: false })
    }
  },

  /** 保存用户信息到缓存 */
  _saveUserInfo() {
    wx.setStorage({
      key: 'userInfo',
      data: {
        avatarUrl: this.data.avatarUrl,
        nickName: this.data.nickName
      }
    })
    wx.setStorage({ key: 'login', data: true })
  },

  /** 获取 openid，拿到即视为已登录 */
  getOpenid() {
    // 先尝试从缓存恢复用户信息
    const userInfo = wx.getStorageSync('userInfo')
    if (userInfo) {
      this.setData({
        login: true,
        avatarUrl: userInfo.avatarUrl || '',
        nickName: userInfo.nickName || ''
      })
    }

    wx.cloud.callFunction({
      name: 'login',
      success: (res) => {
        try {
          const data = res.result && res.result.code === 0 ? res.result.data : res.result
          const openid = (data && data.openid) || ''
          if (openid) {
            this.setData({ openid, login: true })
            wx.setStorage({ key: 'openid', data: openid })
            wx.setStorage({ key: 'login', data: true })
          } else {
            const cached = wx.getStorageSync('openid')
            if (cached) {
              this.setData({ openid: cached, login: true })
            }
          }
        } catch (e) {
          console.error('解析openid失败', e)
          this._fallbackOpenid()
        }
      },
      fail: (err) => {
        console.error('云函数 login 调用失败', err)
        this._fallbackOpenid()
      }
    })
  },

  /** 从缓存恢复 openid */
  _fallbackOpenid() {
    const cached = wx.getStorageSync('openid')
    if (cached) {
      this.setData({ openid: cached, login: true })
    }
  },

  toggleMyPosts() {
    const isExpanded = !this.data.fabu
    this.setData({ fabu: isExpanded })
    if (isExpanded) {
      this.loadCounts()
      this.loadMyPosts()
    }
  },

  loadCounts() {
    const openid = this.data.openid
    if (!openid) return

    db.collection('confessions').where({ _openid: openid }).count({
      success: (res) => { this.setData({ confessions: res.total }) }
    })
    db.collection('items').where({ _openid: openid }).count({
      success: (res) => { this.setData({ items: res.total }) }
    })
    db.collection('lost').where({ _openid: openid }).count({
      success: (res) => { this.setData({ lost: res.total }) }
    })
    db.collection('found').where({ _openid: openid }).count({
      success: (res) => { this.setData({ found: res.total }) }
    })
  },

  /** 加载我的帖子列表（最近5条） */
  loadMyPosts() {
    const openid = this.data.openid
    if (!openid) return

    this.setData({ myPostsLoading: true })

    const promises = USER_COLLECTIONS.map((c) => {
      return new Promise((resolve) => {
        db.collection(c.name).where({ _openid: openid })
          .orderBy('createTime', 'desc').limit(3).get({
            success: (res) => {
              const items = (res.data || []).map((item) => ({
                ...item,
                _col: c.name,
                _label: c.label,
                _titleKey: c.titleKey
              }))
              resolve(items)
            },
            fail: () => resolve([])
          })
      })
    })

    Promise.all(promises).then((results) => {
      let allPosts = []
      results.forEach((arr) => { allPosts = allPosts.concat(arr) })
      allPosts.sort((a, b) => {
        const tA = a.createTime ? new Date(a.createTime).getTime() : 0
        const tB = b.createTime ? new Date(b.createTime).getTime() : 0
        return tB - tA
      })
      this.setData({ myPosts: allPosts.slice(0, 5), myPostsLoading: false })
    }).catch(() => {
      this.setData({ myPostsLoading: false })
    })
  },

  /** 跳转帖子详情 */
  goPost(e) {
    const item = e.currentTarget.dataset.item
    wx.navigateTo({
      url: '../../pages/detail/detail?name=' + item._col + '&id=' + item._id
    })
  },

  /** 删除帖子 */
  deletePost(e) {
    const item = e.currentTarget.dataset.item
    const collection = item._col

    wx.showModal({
      title: '提示',
      content: '确定要删除这条信息吗？',
      success: (modalRes) => {
        if (modalRes.confirm) {
          db.collection(collection).doc(item._id).remove({
            success: () => {
              wx.showToast({ title: '删哒！', icon: 'none' })
              const list = this.data.myPosts.filter((p) => p._id !== item._id)
              this.setData({ myPosts: list })
              this.loadCounts()
            },
            fail: (err) => {
              wx.showToast({ title: '删冇得…再试试', icon: 'none' })
              console.error('删除失败', err)
            }
          })
        }
      }
    })
  },

  /** 分享给好友 */
  onShareAppMessage() {
    return {
      title: '桂乡生活 · 咸宁人的本地生活圈',
      path: 'pages/index/index'
    }
  },

  /** 分享到朋友圈 */
  onShareTimeline() {
    return {
      title: '桂乡生活 · 咸宁人的本地生活圈'
    }
  },

  /** 客服电话 */
  callService() {
    wx.showActionSheet({
      itemList: ['拨打 0715-123456'],
      success: (res) => {
        if (res.tapIndex === 0) {
          wx.makePhoneCall({ phoneNumber: '0715-123456' })
        }
      }
    })
  },

  /** 关于桂乡生活 */
  showAbout() {
    wx.showModal({
      title: '关于桂乡生活',
      content: '桂乡生活是咸宁本地生活服务小程序，提供闲置二手、失物招领、兼职招聘、租房信息、本地美食、旅游景点、表白交友等一站式生活服务。\n\n立足咸宁，服务桂乡。',
      showCancel: false,
      confirmText: '知道了'
    })
  },

  /** 用户协议 */
  showTerms() {
    wx.showModal({
      title: '用户协议',
      content: '使用桂乡生活即表示您同意：\n1. 用户发布内容需真实合法\n2. 禁止发布虚假、诈骗信息\n3. 禁止恶意刷屏、广告骚扰\n4. 本平台仅提供信息展示，不承担交易纠纷\n5. 我们保护用户隐私，不泄露个人信息',
      showCancel: false,
      confirmText: '我知道了'
    })
  },

  /** 隐私政策 */
  showPrivacy() {
    wx.showModal({
      title: '隐私政策',
      content: '桂乡生活承诺：\n1. 仅收集必要的用户信息（昵称、头像、openid）\n2. 不会将用户信息出售或共享给第三方\n3. 用户可随时申请删除个人数据\n4. 我们采取合理的安全措施保护您的数据',
      showCancel: false,
      confirmText: '我知道了'
    })
  }
})
