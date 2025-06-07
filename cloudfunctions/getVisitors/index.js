// cloudfunctions/getVisitors/index.js
const cloud = require('wx-server-sdk')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

const db = cloud.database()

/**
 * 获取访客列表云函数
 */
exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext()
    try {
    const { communityName = '', limit = 50, skip = 0 } = event
    
    // 构建查询条件
    let query = db.collection('visitors')
    
    // 如果指定了小区名称，则进行筛选
    if (communityName) {
      query = query.where({
        communityName: db.RegExp({
          regexp: communityName,
          options: 'i' // 不区分大小写
        })
      })
    }
    
    // 执行查询
    const result = await query
      .orderBy('_createTime', 'desc') // 按创建时间倒序
      .limit(limit)
      .skip(skip)
      .get()
    
    // 获取总数（仅在第一页时获取，避免重复查询）
    let total = 0
    if (skip === 0) {
      const countResult = await query.count()
      total = countResult.total
    }
    
    console.log('查询访客信息成功，当前页', result.data.length, '条记录', skip === 0 ? `，总共${total}条` : '')
    
    return {
      success: true,
      data: result.data,
      total: total,
      hasMore: result.data.length === limit, // 如果返回数据等于请求数量，说明可能还有更多
      message: '获取访客列表成功'
    }
  } catch (err) {
    console.error('获取访客列表失败：', err)
    return {
      success: false,
      message: '获取访客列表失败',
      error: err.message
    }
  }
}
