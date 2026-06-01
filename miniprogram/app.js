App({
  onLaunch: function () {
    //云开发初始化
    wx.cloud.init({
      env:'cloud1-d4g6o6y529c3db4b2',
        traceUser: true
    })

    // 展示本地存储能力
    wx.getStorage({
      key: 'logs',
      success: (res) => {
        const logs = res.data || []
        logs.unshift(Date.now())
        wx.setStorage({ key: 'logs', data: logs })
      },
      fail: () => {
        wx.setStorage({ key: 'logs', data: [Date.now()] })
      }
    })

    // 登录
    wx.login({
      success: res => {
        // 发送 res.code 到后台换取 openId, sessionKey, unionId
      }
    })
  },
  onError: function(err) {
    console.error('全局错误:', err)
    wx.showToast({
      icon: 'none',
      title: '发生错误，请稍后重试'
    })
  },
  onPageNotFound: function(res) {
    wx.switchTab({
      url: 'pages/index/index'
    })
  },
  globalData: {
    userInfo: null
  }
})