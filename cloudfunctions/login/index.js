// 云函数 - 获取用户 openid
const cloud = require('wx-server-sdk')
const { wrap } = require('./response')

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })

exports.main = async (event, context) => {
  return await wrap(async (wxContext) => {
    return {
      openid: wxContext.OPENID,
      appid: wxContext.APPID,
      unionid: wxContext.UNIONID,
      env: wxContext.ENV
    }
  })
}