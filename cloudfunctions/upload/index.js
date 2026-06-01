// 云函数 - 上传图片到云存储
const cloud = require('wx-server-sdk')
const { wrap, error } = require('./response')

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })

exports.main = async (event, context) => {
  return await wrap(async () => {
    if (!event.fileContent || !event.cloudPath) {
      return error('参数不完整')
    }
    return await cloud.uploadFile({
      fileContent: Buffer.from(event.fileContent, 'base64'),
      cloudPath: event.cloudPath
    })
  })
}