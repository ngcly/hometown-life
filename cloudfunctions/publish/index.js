// 云函数 - 发布帖子（闲置/失物/拾物）
const cloud = require('wx-server-sdk')
const { wrap, error } = require('./response')
const { VALID_COLLECTIONS } = require('./constants')

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()

exports.main = async (event, context) => {
  return await wrap(async (wxContext) => {
    // 集合名白名单校验
    if (!VALID_COLLECTIONS.includes(event.room)) {
      return error('无效的集合名称')
    }

    return await db.collection(event.room).add({
      data: {
        _openid: wxContext.OPENID,
        fileIDs: event.fileIDs || [],
        createTime: db.serverDate(),
        sendTime: event.sendTime,
        pName: event.pName || '',
        pCall: event.pCall || '',
        pWechat: event.pWechat || '',
        name: event.name || '',
        price: event.price || '',
        info: event.info || '',
        images: event.imgbox || [],
        touxiang: event.touxiang || '',
        userName: event.userName || ''
      }
    })
  })
}