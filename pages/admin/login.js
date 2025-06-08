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
    // 管理员账户配置
    const adminAccounts = [
      { username: '13828852777', password: 'LINAN123456' },
      { username: '13632729342', password: 'kb123456' }
    ]
    
    // 验证登录信息
    const isValidAdmin = adminAccounts.some(admin => 
      admin.username === this.data.username && admin.password === this.data.password
    )
    
    if (isValidAdmin) {
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
