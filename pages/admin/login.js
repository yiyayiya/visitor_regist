// pages/admin/login.js
Page({
  data: {
    username: '',
    password: ''
  },
  onUsernameInput: function (e) {
    this.setData({
      username: e.detail.value
    })
  },
  onPasswordInput: function (e) {
    this.setData({
      password: e.detail.value
    })
  },
  onLogin: function () {
    // 简单的登录验证
    if (this.data.username === 'admin' && this.data.password === 'password') {
      wx.navigateTo({
        url: '/pages/admin/visitorList'
      })
    } else {
      wx.showToast({
        title: '登录失败',
        icon: 'none'
      })
    }
  }
})
