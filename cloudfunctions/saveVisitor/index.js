// cloudfunctions/saveVisitor/index.js
const cloud = require('wx-server-sdk')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

const db = cloud.database()

/**
 * 保存访客信息云函数
 */
exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext()
  
  try {
    // 获取传入的访客信息
    const {
      avatarUrl,
      nickName,
      phoneNumber,
      communityName,
      areaName,
      cityName
    } = event
    
    // 构建访客信息对象
    const visitorInfo = {
      openid: wxContext.OPENID,
      appid: wxContext.APPID,
      avatarUrl,
      nickName,
      phoneNumber,
      communityName,
      areaName,
      cityName,
      registerTime: new Date(),
      _createTime: db.serverDate()
    }
    
    // 保存到数据库
    const result = await db.collection('visitors').add({
      data: visitorInfo
    })
    
    console.log('访客信息保存成功：', result)
    
    return {
      success: true,
      data: {
        _id: result._id,
        ...visitorInfo
      },
      message: '访客信息保存成功'
    }
  } catch (err) {
    console.error('保存访客信息失败：', err)
    return {
      success: false,
      message: '保存访客信息失败',
      error: err.message
    }
  }
}
