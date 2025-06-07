// pages/result/result.js
Page({
  data: {
    success: false,
    communityName: ''
  },
  onLoad: function (options) {
    this.setData({
      success: options.success === 'true',
      communityName: options.communityName || ''
    })
  },
  onRetry: function () {
    wx.navigateBack()
  }
})
