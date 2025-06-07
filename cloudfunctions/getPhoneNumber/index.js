// cloudfunctions/getPhoneNumber/index.js
const cloud = require('wx-server-sdk')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

/**
 * 获取手机号云函数
 * 使用云调用获取用户手机号
 */
exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext()
  
  try {
    // 使用云调用获取手机号
    const result = await cloud.openapi.phonenumber.getuserphonenumber({
      code: event.code
    })
    
    if (result.errCode === 0) {
      return {
        success: true,
        phoneNumber: result.phoneInfo.phoneNumber,
        purePhoneNumber: result.phoneInfo.purePhoneNumber,
        countryCode: result.phoneInfo.countryCode,
        message: '获取手机号成功'
      }
    } else {
      return {
        success: false,
        message: '获取手机号失败',
        errCode: result.errCode,
        errMsg: result.errMsg
      }
    }
  } catch (err) {
    console.error('获取手机号失败：', err)
    return {
      success: false,
      message: '获取手机号失败',
      error: err.message
    }
  }
}
