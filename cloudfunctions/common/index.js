// 公共模块 - 供其他云函数共享使用
// 不是独立云函数，不对外暴露接口
const { wrap, error, success } = require('./response')
const { VALID_COLLECTIONS } = require('./constants')

module.exports = { wrap, error, success, VALID_COLLECTIONS }
