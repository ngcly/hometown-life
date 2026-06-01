/**
 * 登录状态检查工具模块
 * 统一管理登录验证逻辑
 */
const auth = {
  /**
   * 检查用户是否已登录
   * @returns {Promise<boolean>} 是否已登录
   */
  checkLogin() {
    return new Promise((resolve) => {
      wx.getStorage({
        key: 'login',
        success: (res) => {
          if (res.data) {
            resolve(true)
          } else {
            wx.showToast({ icon: "none", title: '你还未登录' })
            resolve(false)
          }
        },
        fail: () => {
          wx.showToast({ icon: "none", title: '你还未登录' })
          resolve(false)
        }
      })
    })
  }
}

module.exports = auth
