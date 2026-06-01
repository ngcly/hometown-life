const { getList } = require('../utils/db')

Page({

  /**
   * 页面的初始数据
   */
  data: {
    // 首页问候语（按月切换）
    greeting: '五月桂乡 · 初夏好时光',
    greetingIcon: '🌿',

    // 轮播图数据
    slides: [
      {
        id: 1,
        title: '桂乡生活',
        subtitle: '中国桂花之城 · 湖北咸宁',
        tags: ['便民服务', '闲置交易', '桂乡文化'],
        bg: 'linear-gradient(135deg, #E8A33D 0%, #D4872B 100%)',
        icon: '🏡'
      },
      {
        id: 2,
        title: '闲置交易',
        subtitle: '二手好物，低价淘到宝',
        tags: ['数码', '家居', '服饰', '更多'],
        bg: 'linear-gradient(135deg, #F5A623 0%, #E88A2B 100%)',
        icon: '🛒'
      },
      {
        id: 3,
        title: '温泉之乡',
        subtitle: '沐温泉赏桂花，尽在咸宁',
        tags: ['温泉攻略', '赏桂地图', '品质生活'],
        bg: 'linear-gradient(135deg, #4AA3A2 0%, #3B8B8A 100%)',
        icon: '♨️'
      }
    ],
    // 快捷功能入口（九宫格）
    quickEntries: [
      {"url":"../../packageLife/lost/lost","name":"失物招领","icon":"../../images/lost.png","bgColor":"#FFF3E0"},
      {"url":"../../packageService/services/services","name":"便民服务","icon":"../../images/service_phone.png","bgColor":"#FFF8E1"},
      {"url":"../../packageLife/jobs/jobs","name":"兼职工作","icon":"../../images/job.png","bgColor":"#F1F8E9"},
      {"url":"../../packageLife/rent/rent","name":"房屋租售","icon":"../../images/house.png","bgColor":"#FFF3E0"},
      {"url":"../../packageSocial/dating/dating","name":"同城交友","icon":"../../images/marriage.png","bgColor":"#FCE4EC"},
      {"url":"../../packageLife/food/food","name":"佳肴美馔","icon":"../../images/food.png","bgColor":"#FFF0E6"},
      {"url":"../../packageFun/story/story","name":"桂乡故事","icon":"../../images/story.png","bgColor":"#FFF8E1"},
      {"url":"../../packageLife/travel/travel","name":"锦绣河山","icon":"../../images/travel.png","bgColor":"#E6F7FF"},
      {"url":"../../packageFun/entertainment/entertainment","name":"观影吊嗓","icon":"../../images/movie.png","bgColor":"#FFF0E6"}
    ],
    // 最新动态信息流
    feed: [],
    feedLoading: false
  },

  goSearch() {
    wx.navigateTo({ url: '../../packageFun/search/search' })
  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow() {
    this.loadFeed()
  },

  // 加载最新动态
  async loadFeed() {
    this.setData({ feedLoading: true })
    try {
      const collections = [
        { name: 'items', label: '闲置' },
        { name: 'lost', label: '失物' },
        { name: 'found', label: '拾物' },
        { name: 'jobs', label: '兼职' },
        { name: 'confessions', label: '表白' }
      ]
      const promises = collections.map(c =>
        getList({ collection: c.name, pageSize: 3 })
          .then(res => res.data.map(item => ({ ...item, _col: c.name, _label: c.label })))
          .catch(() => [])
      )
      const results = await Promise.all(promises)
      let feed = results.flat()
      feed.sort((a, b) => {
        const tA = a.createTime ? new Date(a.createTime).getTime() : 0
        const tB = b.createTime ? new Date(b.createTime).getTime() : 0
        return tB - tA
      })
      this.setData({ feed: feed.slice(0, 10), feedLoading: false })
    } catch (e) {
      console.error('加载动态失败:', e)
      this.setData({ feedLoading: false })
    }
  },

  // 点击信息流项
  goFeedDetail(e) {
    const item = e.currentTarget.dataset.item
    wx.navigateTo({
      url: '../../pages/detail/detail?name=' + item._col + '&id=' + item._id
    })
  },

  onShareAppMessage() {
    return {
      title: '桂乡生活 · 咸宁人的本地生活圈',
      path: this.route
    }
  }
})
