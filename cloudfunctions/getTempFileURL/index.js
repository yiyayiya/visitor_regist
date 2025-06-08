// cloudfunctions/getTempFileURL/index.js
const cloud = require('wx-server-sdk')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

/**
 * 获取文件临时访问链接
 */
exports.main = async (event, context) => {
  try {
    const { fileList } = event
    
    if (!fileList || !Array.isArray(fileList)) {
      return {
        success: false,
        message: '参数错误：fileList必须是数组'
      }
    }
    
    // 调用云函数获取临时链接
    const result = await cloud.getTempFileURL({
      fileList: fileList
    })
    
    console.log('获取临时链接结果:', result)
    
    return {
      success: true,
      fileList: result.fileList
    }
  } catch (error) {
    console.error('获取临时链接失败:', error)
    return {
      success: false,
      message: '获取临时链接失败',
      error: error.message
    }
  }
}
