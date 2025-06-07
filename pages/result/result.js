// pages/result/result.js
Page({
  data: {
    success: false,
    communityName: ''
  },
  onLoad: function (options) {
    this.setData({
      success: options.success === 'true',
      communityName: decodeURIComponent(options.communityName || '')
    })
  },
  onRetry: function () {
    wx.navigateBack()
  }
})
