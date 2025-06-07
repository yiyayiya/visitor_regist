// cloudfunctions/generateQRCode/index.js
const cloud = require('wx-server-sdk')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

/**
 * 生成小程序二维码云函数
 * 用于批量生成不同小区的二维码
 */
exports.main = async (event, context) => {
  try {
    const {
      communityName,
      areaName,
      cityName,
      scene = '',
      page = 'pages/index/index',
      width = 430,
      isHyaline = false
    } = event

    // 构建场景值（小程序码的参数）
    let sceneValue = scene
    if (!sceneValue && communityName && areaName && cityName) {
      // 如果没有提供scene，则根据小区信息构建
      sceneValue = `c=${encodeURIComponent(communityName)}&a=${encodeURIComponent(areaName)}&city=${encodeURIComponent(cityName)}`
    }

    // 生成小程序码
    const result = await cloud.openapi.wxacode.getUnlimited({
      scene: sceneValue,
      page: page,
      width: width,
      isHyaline: isHyaline,
      envVersion: 'trial' // 体验版，可以改为 'release'（正式版）或 'develop'（开发版）
    })

    if (result.errCode === 0) {
      // 将二维码图片保存到云存储
      const uploadResult = await cloud.uploadFile({
        cloudPath: `qrcodes/${communityName}_${Date.now()}.jpg`,
        fileContent: result.buffer
      })

      return {
        success: true,
        qrCodeUrl: uploadResult.fileID,
        cloudPath: uploadResult.cloudPath,
        scene: sceneValue,
        message: '二维码生成成功'
      }
    } else {
      return {
        success: false,
        message: '二维码生成失败',
        errCode: result.errCode,
        errMsg: result.errMsg
      }
    }
  } catch (err) {
    console.error('生成二维码失败：', err)
    return {
      success: false,
      message: '生成二维码失败',
      error: err.message
    }
  }
}
