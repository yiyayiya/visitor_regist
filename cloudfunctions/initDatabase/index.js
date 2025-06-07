// cloudfunctions/initDatabase/index.js
const cloud = require('wx-server-sdk')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

const db = cloud.database()

/**
 * 数据库初始化云函数
 * 创建必要的集合和索引
 */
exports.main = async (event, context) => {
  try {
    // 尝试创建 visitors 集合（如果不存在）
    try {
      await db.createCollection('visitors')
      console.log('visitors 集合创建成功')
    } catch (error) {
      if (error.errCode === -502006) {
        console.log('visitors 集合已存在')
      } else {
        console.error('创建 visitors 集合失败:', error)
      }
    }
    
    // 检查集合是否存在
    const collections = await db.listCollections()
    const visitorsExists = collections.collections.some(col => col.name === 'visitors')
    
    if (visitorsExists) {
      // 创建索引
      try {
        await db.collection('visitors').createIndex({
          keys: { communityName: 1 },
          name: 'communityName_index'
        })
        console.log('communityName 索引创建成功')
      } catch (error) {
        console.log('communityName 索引可能已存在:', error.message)
      }
      
      try {
        await db.collection('visitors').createIndex({
          keys: { registerTime: -1 },
          name: 'registerTime_index'
        })
        console.log('registerTime 索引创建成功')
      } catch (error) {
        console.log('registerTime 索引可能已存在:', error.message)
      }
    }
    
    return {
      success: true,
      message: '数据库初始化完成',
      collectionsExists: visitorsExists
    }
    
  } catch (error) {
    console.error('数据库初始化失败:', error)
    return {
      success: false,
      message: '数据库初始化失败',
      error: error.message
    }
  }
}
