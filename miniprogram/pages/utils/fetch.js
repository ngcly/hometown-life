/**
 * HTTP 请求工具模块
 * 基于 wx.request 的 Promise 封装
 */

function fetch(options = {}) {
  return new Promise((resolve, reject) => {
    wx.request({
      url: options.url,
      method: options.method || 'GET',
      data: options.data,
      header: options.header || {},
      dataType: options.dataType || 'json',
      responseType: options.responseType || 'text',
      timeout: options.timeout || 30000,
      enableHttp2: options.enableHttp2 || false,
      enableQuic: options.enableQuic || false,
      success: (res) => resolve(res),
      fail: (error) => reject(error)
    })
  })
}

module.exports = fetch
