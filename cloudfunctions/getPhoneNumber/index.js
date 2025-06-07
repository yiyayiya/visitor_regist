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
  
  console.log('=== 获取手机号云函数开始执行 ===')
  console.log('收到请求参数:', JSON.stringify(event, null, 2))
  console.log('用户上下文:', {
    OPENID: wxContext.OPENID,
    APPID: wxContext.APPID,
    UNIONID: wxContext.UNIONID
  })
  
  // 验证输入参数
  if (!event.code) {
    console.error('错误：缺少code参数')
    return {
      success: false,
      message: '缺少必要参数code',
      errCode: 'MISSING_CODE'
    }
  }
  
  try {
    // 使用云调用获取手机号 - 根据官方文档修正API调用
    console.log('开始调用微信API，code:', event.code)
    
    const result = await cloud.openapi.phonenumber.getPhoneNumber({
      code: event.code
    })
      console.log('微信API完整返回结果：', JSON.stringify(result, null, 2))
    // 实际API返回字段是 errCode 和 phoneInfo（不是官方文档中的 errcode 和 phone_info）
    console.log('检查API返回状态...')
    console.log('errCode:', result.errCode)
    console.log('errMsg:', result.errMsg)
    
    if (result.errCode === 0) {
      console.log('API调用成功，开始解析手机号信息...')
      console.log('phoneInfo:', JSON.stringify(result.phoneInfo, null, 2))
      
      if (result.phoneInfo && result.phoneInfo.phoneNumber) {
        const response = {
          success: true,
          phoneNumber: result.phoneInfo.phoneNumber,
          purePhoneNumber: result.phoneInfo.purePhoneNumber,
          countryCode: result.phoneInfo.countryCode,
          message: '获取手机号成功'
        }
        console.log('成功返回结果:', JSON.stringify(response, null, 2))
        return response
      } else {
        console.error('API返回成功但phoneInfo为空:', result.phoneInfo)
        return {
          success: false,
          message: 'API返回数据格式异常',
          errCode: 'INVALID_PHONE_INFO',
          fullResult: result
        }
      }
    } else {
      // 处理特定错误码
      let errorMessage = '获取手机号失败'
      if (result.errCode === -604100) {
        errorMessage = '手机号获取权限未配置，请联系管理员配置权限'
      } else if (result.errMsg) {
        errorMessage = result.errMsg
      }
      
      return {
        success: false,
        message: errorMessage,
        errCode: result.errCode,
        errMsg: result.errMsg,
        fullResult: result  // 包含完整的结果用于调试
      }
    }} catch (err) {
    console.error('云函数执行异常：', JSON.stringify(err, null, 2))
    console.error('错误详情：', err.message)
    console.error('错误堆栈：', err.stack)
    
    // 检查是否是权限错误
    let errorMessage = '获取手机号失败'
    let errCode = err.errCode || -1
    
    if (err.errCode === -604100) {
      errorMessage = '手机号获取权限未配置，请联系管理员配置 openapi.phonenumber.getuserphonenumber 权限'
      errCode = -604100
    } else if (err.errMsg && err.errMsg.includes('-604100')) {
      errorMessage = '手机号获取权限未配置，请联系管理员配置 openapi.phonenumber.getuserphonenumber 权限'
      errCode = -604100
    } else if (err.message) {
      errorMessage = err.message
    }
    
    return {
      success: false,
      message: errorMessage,
      errCode: errCode,
      error: err.errMsg || err.message || err.toString(),
      rawError: err
    }
  }
}
