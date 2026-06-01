/**
 * 云函数通用响应工具
 * 统一的成功/失败响应格式
 */

/**
 * 成功响应
 * @param {*} data - 返回数据
 * @returns {object} { code: 0, data }
 */
function success(data) {
  return { code: 0, data }
}

/**
 * 错误响应
 * @param {string} message - 错误描述
 * @returns {object} { code: -1, error: message }
 */
function error(message) {
  return { code: -1, error: message }
}

/**
 * 异步处理包装器
 * 自动包裹 try/catch，统一错误格式
 * @param {Function} handler - 异步处理函数，接收 wxContext 参数
 * @returns {Promise<object>}
 */
async function wrap(handler) {
  try {
    const cloud = require('wx-server-sdk')
    const wxContext = cloud.getWXContext()
    const result = await handler(wxContext)
    return success(result)
  } catch (e) {
    console.error('[CloudFunction Error]', e)
    return error(e.message || '未知错误')
  }
}

module.exports = { success, error, wrap }
