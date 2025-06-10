// pages/result/result.js
Page({
  data: {
    success: false,
    communityName: '',
    areaName: '',
    doorName: '' // 增加门名称字段
  },
  onLoad: function (options) {
    this.setData({
      success: options.success === 'true',
      communityName: decodeURIComponent(options.communityName || ''),
      areaName: decodeURIComponent(options.areaName || ''),
      doorName: options.doorName ? decodeURIComponent(options.doorName) : '' // 解析门名称
    })
  },
  onRetry: function () {
    wx.navigateBack()
  }
})
