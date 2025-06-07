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
    const { communityName = '', limit = 100, skip = 0 } = event
    
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
    
    console.log('查询访客信息成功，共', result.data.length, '条记录')
    
    return {
      success: true,
      data: result.data,
      total: result.data.length,
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
