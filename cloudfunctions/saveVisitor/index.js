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
  
  try {    // 获取传入的访客信息
    const {
      avatarUrl,
      nickName,
      phoneNumber,
      communityName,
      areaName,
      cityName,
      doorName // 新增门名称参数
    } = event
      console.log('开始保存访客信息，原始头像URL:', avatarUrl)
    console.log('头像URL类型检测:', {
      isWxfile: avatarUrl?.includes('wxfile://'),
      isTmp: avatarUrl?.includes('tmp'),
      isHttps: avatarUrl?.includes('https://'),
      urlLength: avatarUrl?.length
    })
    
    let finalAvatarUrl = avatarUrl
    
    // 处理头像上传到云存储
    if (avatarUrl) {
      try {
        console.log('开始处理头像上传...')
        console.log('调用 uploadAvatar 云函数，参数:', { avatarUrl: avatarUrl })
        
        const uploadResult = await cloud.callFunction({
          name: 'uploadAvatar',
          data: {
            avatarUrl: avatarUrl
          }
        })
        
        console.log('头像上传云函数调用完成')
        console.log('uploadResult.result:', JSON.stringify(uploadResult.result, null, 2))
        
        if (uploadResult.result && uploadResult.result.success) {
          finalAvatarUrl = uploadResult.result.cloudUrl
          console.log('✅ 头像转存成功!')
          console.log('原始URL:', avatarUrl)
          console.log('云存储URL:', finalAvatarUrl)
        } else {
          console.error('❌ 头像上传失败!')
          console.error('失败原因:', uploadResult.result?.message || '未知错误')
          console.error('完整响应:', JSON.stringify(uploadResult, null, 2))
          // 头像上传失败时，仍然保存原始URL，不阻断整个流程
        }
      } catch (uploadError) {
        console.error('❌ 调用头像上传云函数异常:', uploadError)
        console.error('错误详情:', {
          message: uploadError.message,
          stack: uploadError.stack,
          errCode: uploadError.errCode,
          errMsg: uploadError.errMsg
        })
        // 头像上传失败时，使用原始URL，不阻断整个流程
      }
    } else {
      console.warn('⚠️ 未提供头像URL，跳过头像处理')
    }
    
    // 构建访客信息对象
    const visitorInfo = {
      openid: wxContext.OPENID,
      appid: wxContext.APPID,
      avatarUrl: finalAvatarUrl, // 使用处理后的头像URL
      originalAvatarUrl: avatarUrl, // 保存原始头像URL用于调试
      nickName,
      phoneNumber,
      communityName,
      areaName,
      cityName,
      doorName, // 保存门名称
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
