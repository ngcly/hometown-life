/**
 * 数据库操作工具模块
 * 封装通用的云数据库 CRUD 操作
 */

const db = wx.cloud.database()

/**
 * 获取分页列表
 * @param {string} params.collection - 集合名称
 * @param {number} params.pageSize - 每页数量（默认20）
 * @param {number} params.page - 页码（从0开始）
 * @param {object} params.where - 查询条件
 * @param {string} params.orderBy.field - 排序字段
 * @param {string} params.orderBy.direction - 排序方向 'asc' 或 'desc'
 * @returns {Promise<{data: Array, hasMore: boolean}>}
 */
function getList({ collection, pageSize = 20, page = 0, where, orderBy } = {}) {
  return new Promise((resolve, reject) => {
    let query = db.collection(collection)
    if (where) query = query.where(where)
    if (orderBy) {
      query = query.orderBy(orderBy.field, orderBy.direction || 'desc')
    } else {
      query = query.orderBy('createTime', 'desc')
    }
    query
      .skip(page * pageSize)
      .limit(pageSize)
      .get({
        success: (res) => {
          resolve({
            data: res.data,
            hasMore: res.data.length === pageSize
          })
        },
        fail: (err) => reject(err)
      })
  })
}

/**
 * 按 ID 获取详情
 * @param {string} params.collection - 集合名称
 * @param {string} params.id - 文档 ID
 * @returns {Promise<object>}
 */
function getDetail({ collection, id } = {}) {
  return new Promise((resolve, reject) => {
    db.collection(collection).doc(id).get({
      success: (res) => resolve(res.data),
      fail: (err) => reject(err)
    })
  })
}

/**
 * 删除文档
 * @param {string} params.collection - 集合名称
 * @param {string} params.id - 文档 ID
 * @returns {Promise}
 */
function removeItem({ collection, id } = {}) {
  return new Promise((resolve, reject) => {
    db.collection(collection).doc(id).remove({
      success: (res) => resolve(res),
      fail: (err) => reject(err)
    })
  })
}

/**
 * 条件计数
 * @param {string} params.collection - 集合名称
 * @param {object} params.where - 查询条件
 * @returns {Promise<number>}
 */
function countWhere({ collection, where = {} } = {}) {
  return new Promise((resolve, reject) => {
    db.collection(collection).where(where).count({
      success: (res) => resolve(res.total),
      fail: (err) => reject(err)
    })
  })
}

module.exports = { getList, getDetail, removeItem, countWhere }
