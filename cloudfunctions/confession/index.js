// 云函数 - 发布表白
const cloud = require('wx-server-sdk')
const { wrap, error } = require('./response')

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()

exports.main = async (event, context) => {
  return await wrap(async (wxContext) => {
    // 输入验证
    if (!event.info || event.info.length < 6) {
      return error('内容不能少于6个字符')
    }
    if (!event.to) {
      return error('表白对象不能为空')
    }
    if (!event.writer) {
      return error('称呼不能为空')
    }

    return await db.collection("confessions").add({
      data: {
        _openid: wxContext.OPENID,
        createTime: db.serverDate(),
        info: event.info,
        to: event.to,
        writer: event.writer,
        sendTime: event.sendTime,
        like: 0
      }
    })
  })
}