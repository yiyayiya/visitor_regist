// cloudfunctions/getPhoneNumberFallback/index.js
const cloud = require('wx-server-sdk')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

/**
 * 获取手机号云函数 - 降级版本
 * 当无法获取API权限时的临时解决方案
 */
exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext()
  
  console.log('收到获取手机号请求，code:', event.code)
  console.log('用户openid:', wxContext.OPENID)
  
  try {
    // 尝试使用云调用获取手机号
    const result = await cloud.openapi.phonenumber.getuserphonenumber({
      code: event.code
    })
    
    console.log('云调用结果:', result)
    
    if (result.errCode === 0 && result.phoneInfo) {
      return {
        success: true,
        phoneNumber: result.phoneInfo.phoneNumber,
        purePhoneNumber: result.phoneInfo.purePhoneNumber,
        countryCode: result.phoneInfo.countryCode,
        message: '获取手机号成功'
      }
    } else {
      console.log('云调用失败，错误码:', result.errCode)
      return {
        success: false,
        message: '获取手机号失败',
        errCode: result.errCode,
        errMsg: result.errMsg,
        needManualInput: true  // 标识需要手动输入
      }
    }
  } catch (err) {
    console.error('获取手机号异常：', err)
    
    // 检查是否是权限问题
    if (err.errCode === -604100 || (err.message && err.message.includes('-604100'))) {
      return {
        success: false,
        message: '获取手机号权限未配置',
        error: err.message,
        errCode: -604100,
        needManualInput: true,  // 标识需要手动输入
        suggestedAction: 'CONFIGURE_PERMISSION'  // 建议配置权限
      }
    }
    
    return {
      success: false,
      message: '获取手机号失败',
      error: err.message,
      needManualInput: true
    }
  }
}
