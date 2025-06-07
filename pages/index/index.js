// pages/index/index.js
const util = require('../../utils/util.js')

Page({
  data: {
    communityName: '',
    areaName: '',
    cityName: '',
    userInfo: null // 存储用户基本信息
  },
  onLoad: function (options) {
    // 页面加载时，解析传入的参数
    if (options.community_name && options.area_name && options.city_name) {
      this.setData({
        communityName: options.community_name,
        areaName: options.area_name,
        cityName: options.city_name
      })
    }
  },
  
  // 点击一键登记按钮时先获取用户基本信息
  onRegister: function () {
    // 获取用户基本信息（头像、昵称）
    wx.getUserProfile({
      desc: '用于完善访客信息',
      success: (res) => {
        const userInfo = res.userInfo
        // 保存用户基本信息，等待手机号授权
        this.setData({
          userInfo: userInfo
        })
        console.log('获取用户基本信息成功:', userInfo)
      },
      fail: () => {
        wx.showToast({
          title: '需要授权才能登记',
          icon: 'none'
        })
        setTimeout(() => {
          wx.navigateTo({
            url: `/pages/result/result?success=false&communityName=${encodeURIComponent(this.data.communityName)}`
          })
        }, 1500)
      }
    })
  },

  // 获取手机号回调
  onGetPhoneNumber: function (e) {
    console.log('手机号授权结果:', e)
    
    if (e.detail.errMsg === 'getPhoneNumber:ok') {
      // 手机号获取成功
      const phoneCode = e.detail.code
      
      // 这里需要调用后端接口解析code获取真实手机号
      // 由于是演示，我们模拟处理
      this.decodePhoneNumber(phoneCode)
    } else {
      // 用户拒绝授权手机号
      if (this.data.userInfo) {
        // 如果已经获取了用户基本信息，询问是否继续
        wx.showModal({
          title: '提示',
          content: '未授权手机号，是否继续登记？',
          success: (res) => {
            if (res.confirm) {
              this.saveVisitorInfo(this.data.userInfo, '用户未授权手机号')
            } else {
              wx.navigateTo({
                url: `/pages/result/result?success=false&communityName=${encodeURIComponent(this.data.communityName)}`
              })
            }
          }
        })
      } else {
        // 没有用户基本信息，登记失败
        wx.navigateTo({
          url: `/pages/result/result?success=false&communityName=${encodeURIComponent(this.data.communityName)}`
        })
      }
    }
  },

  // 解析手机号（使用云函数）
  decodePhoneNumber: function (code) {
    wx.showLoading({
      title: '正在获取手机号'
    })
    
    // 调用云函数获取手机号
    wx.cloud.callFunction({
      name: 'getPhoneNumber',
      data: {
        code: code
      }
    }).then(res => {
      wx.hideLoading()
      console.log('云函数返回结果：', res.result)
      
      if (res.result.success) {
        const phoneNumber = res.result.phoneNumber
        this.saveVisitorInfoToCloud(this.data.userInfo, phoneNumber)
      } else {
        wx.showToast({
          title: res.result.message || '获取手机号失败',
          icon: 'none'
        })
        this.saveVisitorInfoToCloud(this.data.userInfo, '获取手机号失败')
      }
    }).catch(err => {
      wx.hideLoading()
      console.error('调用云函数失败：', err)
      wx.showToast({
        title: '获取手机号失败',
        icon: 'none'
      })
      this.saveVisitorInfoToCloud(this.data.userInfo, '获取手机号失败')
    })
    
    /* 原来的模拟方法，现在可以删除
    setTimeout(() => {
      wx.hideLoading()
      const phoneNumber = '138****8888'
      this.saveVisitorInfo(this.data.userInfo, phoneNumber)
    }, 1000)
    */
  },

  // 保存访客信息到云数据库
  saveVisitorInfoToCloud: function (userInfo, phoneNumber) {
    wx.showLoading({
      title: '正在保存信息'
    })
    
    // 调用云函数保存访客信息
    wx.cloud.callFunction({
      name: 'saveVisitor',
      data: {
        avatarUrl: userInfo.avatarUrl,
        nickName: userInfo.nickName,
        phoneNumber: phoneNumber,
        communityName: this.data.communityName,
        areaName: this.data.areaName,
        cityName: this.data.cityName
      }
    }).then(res => {
      wx.hideLoading()
      console.log('保存访客信息结果：', res.result)
      
      if (res.result.success) {
        // 同时保存到本地全局数据（为了管理员界面显示）
        const app = getApp()
        app.globalData.visitors.push(res.result.data)
        
        wx.navigateTo({
          url: `/pages/result/result?success=true&communityName=${encodeURIComponent(this.data.communityName)}`
        })
      } else {
        wx.showToast({
          title: res.result.message || '保存失败',
          icon: 'none'
        })
        wx.navigateTo({
          url: `/pages/result/result?success=false&communityName=${encodeURIComponent(this.data.communityName)}`
        })
      }
    }).catch(err => {
      wx.hideLoading()
      console.error('调用保存云函数失败：', err)
      wx.showToast({
        title: '保存失败',
        icon: 'none'
      })
      wx.navigateTo({
        url: `/pages/result/result?success=false&communityName=${encodeURIComponent(this.data.communityName)}`
      })
    })
  },

  // 原来的本地保存方法（保留作为备用）
  saveVisitorInfo: function (userInfo, phoneNumber) {
    const visitorInfo = {
      avatarUrl: userInfo.avatarUrl,
      nickName: userInfo.nickName,
      phoneNumber: phoneNumber,
      communityName: this.data.communityName,
      areaName: this.data.areaName,
      cityName: this.data.cityName,
      registerTime: new Date().toLocaleString()
    }
    
    // 将访客信息添加到全局数据中
    const app = getApp()
    app.globalData.visitors.push(visitorInfo)
    
    console.log('访客信息已保存:', visitorInfo)
    
    // 跳转到结果页面
    wx.navigateTo({
      url: `/pages/result/result?success=true&communityName=${encodeURIComponent(this.data.communityName)}`
    })
  },
  
  // 管理员登录入口
  onAdminLogin: function () {
    wx.navigateTo({
      url: '/pages/admin/login'
    })
  }
})
