/**
 * 云函数通用常量
 */

// 允许的数据库集合名称白名单
const VALID_COLLECTIONS = [
   'items',   // 闲置物品
  'lost',      // 失物
  'found',     // 拾物
  'confessions',   // 表白
  'jobs',   // 兼职
  'rentals',    // 房屋租售
  'story',     // 桂乡故事
  'food',      // 美食
  'travel',    // 旅游
  'entertainment', // 娱乐
]

module.exports = { VALID_COLLECTIONS }
