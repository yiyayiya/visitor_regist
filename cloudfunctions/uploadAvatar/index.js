// cloudfunctions/uploadAvatar/index.js
const cloud = require('wx-server-sdk')
const request = require('request')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

/**
 * 头像上传云函数
 * 下载用户头像并上传到云存储
 */
exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext()
  
  console.log('🚀 uploadAvatar 云函数开始执行')
  console.log('输入参数:', JSON.stringify(event, null, 2))
  console.log('执行环境:', {
    OPENID: wxContext.OPENID,
    APPID: wxContext.APPID,
    ENV: cloud.DYNAMIC_CURRENT_ENV
  })
  
  try {
    const { avatarUrl } = event
    
    if (!avatarUrl) {
      console.error('❌ 头像URL为空')
      return {
        success: false,
        message: '头像URL不能为空'
      }
    }
    
    console.log('📥 接收到头像URL:', avatarUrl)
    console.log('URL分析:', {
      length: avatarUrl.length,
      protocol: avatarUrl.split('://')[0],
      isWxfile: avatarUrl.startsWith('wxfile://'),
      isTmp: avatarUrl.includes('tmp'),
      isHttps: avatarUrl.startsWith('https://'),
      isCloudStorage: avatarUrl.includes('cloud://') || avatarUrl.includes('.tcb.qcloud.la')
    })
    
    // 检查是否已经是云存储URL，如果是则直接返回
    if (avatarUrl.includes('cloud://') || avatarUrl.includes('.tcb.qcloud.la')) {
      console.log('✅ 头像已存储在云存储中，直接返回')
      return {
        success: true,
        cloudUrl: avatarUrl,
        message: '头像已存储在云存储中'
      }
    }
    
    console.log('🔄 开始处理头像下载和上传...')
    
    let imageBuffer
      // 处理不同类型的头像URL
    if (avatarUrl.startsWith('wxfile://') || avatarUrl.startsWith('http://tmp/')) {
      // 临时文件路径，需要通过微信API下载
      console.log('📱 检测到微信临时文件，开始下载...')
      try {
        console.log('调用 cloud.downloadFile，fileID:', avatarUrl)
        const downloadResult = await cloud.downloadFile({
          fileID: avatarUrl
        })
        console.log('📦 下载结果:', {
          success: !!downloadResult.fileContent,
          bufferSize: downloadResult.fileContent?.length || 0
        })
        imageBuffer = downloadResult.fileContent
        console.log('✅ 微信临时文件下载成功')
      } catch (downloadError) {
        console.error('❌ 下载临时文件失败:', downloadError)
        console.error('错误详情:', {
          message: downloadError.message,
          errCode: downloadError.errCode,
          errMsg: downloadError.errMsg
        })
        return {
          success: false,
          message: '下载临时文件失败',
          error: downloadError.message
        }
      }    } else if (avatarUrl.startsWith('https://')) {
      // HTTP/HTTPS URL，通过网络请求下载
      console.log('🌐 检测到网络图片，开始下载...')
      try {
        imageBuffer = await downloadImageFromUrl(avatarUrl)
        console.log('✅ 网络图片下载成功')
      } catch (downloadError) {
        console.error('❌ 下载网络图片失败:', downloadError)
        return {
          success: false,
          message: '下载网络图片失败',
          error: downloadError.message
        }
      }
    } else {
      console.error('❌ 不支持的URL格式:', avatarUrl)
      return {
        success: false,
        message: '不支持的头像URL格式'
      }
    }
    
    if (!imageBuffer) {
      console.error('❌ 图片数据为空')
      return {
        success: false,
        message: '获取图片数据失败'
      }
    }
    
    console.log('📊 图片数据获取成功，大小:', imageBuffer.length, 'bytes')
    
    // 生成文件名
    const timestamp = Date.now()
    const fileExtension = getFileExtension(avatarUrl) || 'jpg'
    const fileName = `avatars/${wxContext.OPENID}_${timestamp}.${fileExtension}`
    
    console.log('📝 生成文件名:', fileName)
    
    // 上传到云存储
    console.log('☁️ 开始上传到云存储...')
    const uploadResult = await cloud.uploadFile({
      cloudPath: fileName,
      fileContent: imageBuffer
    })
    
    console.log('📤 云存储上传结果:', {
      success: !!uploadResult.fileID,
      fileID: uploadResult.fileID,
      statusCode: uploadResult.statusCode
    })
      if (uploadResult.fileID) {
      console.log('🎉 头像上传到云存储成功!')
      console.log('原始URL:', avatarUrl)
      console.log('云存储URL:', uploadResult.fileID)
      
      return {
        success: true,
        cloudUrl: uploadResult.fileID,
        originalUrl: avatarUrl,
        message: '头像上传成功'
      }
    } else {
      console.error('❌ 云存储上传失败，未获得 fileID')
      return {
        success: false,
        message: '云存储上传失败',
        error: '未获得 fileID'
      }
    }
    
  } catch (error) {
    console.error('❌ 头像上传处理异常:', error)
    console.error('错误详情:', {
      message: error.message,
      stack: error.stack,
      name: error.name
    })
    return {
      success: false,
      message: '头像上传处理失败',
      error: error.message
    }
  }
}

/**
 * 从URL下载图片
 */
function downloadImageFromUrl(url) {
  return new Promise((resolve, reject) => {
    const options = {
      url: url,
      encoding: null, // 重要：设置为null以获取Buffer
      timeout: 10000, // 10秒超时
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    }
    
    request.get(options, (error, response, body) => {
      if (error) {
        reject(error)
        return
      }
      
      if (response.statusCode !== 200) {
        reject(new Error(`HTTP ${response.statusCode}: ${response.statusMessage}`))
        return
      }
      
      resolve(body)
    })
  })
}

/**
 * 获取文件扩展名
 */
function getFileExtension(url) {
  try {
    const urlParts = url.split('/')
    const fileName = urlParts[urlParts.length - 1]
    const fileParts = fileName.split('.')
    if (fileParts.length > 1) {
      return fileParts[fileParts.length - 1].split('?')[0] // 移除查询参数
    }
  } catch (e) {
    console.warn('获取文件扩展名失败:', e)
  }
  return 'jpg' // 默认使用jpg
}
