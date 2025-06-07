// pages/index/index.js
const util = require('../../utils/util.js')

// 默认头像
const defaultAvatarUrl = 'https://mmbiz.qpic.cn/mmbiz/icTdbqWNOwNRna42FI242Lcia07jQodd2FJGIYQfG0LAJGFxM4FbnQP6yfMxBgJ0F3YRqJCJ1aPAK2dQagdusBZg/0'

Page({  data: {
    communityName: '',
    areaName: '',
    cityName: '',
    avatarUrl: defaultAvatarUrl, // 用户头像
    defaultAvatarUrl: defaultAvatarUrl, // 默认头像URL，供WXML使用
    nickName: '', // 用户昵称
    userInfo: null // 存储用户基本信息
  },onLoad: function (options) {
    // 页面加载时，解析传入的参数
    if (options.community_name && options.area_name && options.city_name) {
      this.setData({
        communityName: decodeURIComponent(options.community_name),
        areaName: decodeURIComponent(options.area_name),
        cityName: decodeURIComponent(options.city_name)
      })
      
      // 动态设置导航栏标题
      wx.setNavigationBarTitle({
        title: decodeURIComponent(options.community_name)
      })
    }
  },
    // 选择头像回调
  onChooseAvatar: function(e) {
    const { avatarUrl } = e.detail
    this.setData({
      avatarUrl
    })
    console.log('用户选择头像:', avatarUrl)
  },
  
  // 昵称输入回调
  onNickNameInput: function(e) {
    const nickName = e.detail.value
    this.setData({
      nickName
    })
    console.log('用户输入昵称:', nickName)
  },
  
  // 点击一键登记按钮时的处理（现在主要是验证）
  onRegister: function () {
    // 验证用户是否已经填写了头像和昵称
    if (!this.data.avatarUrl || this.data.avatarUrl === defaultAvatarUrl) {
      wx.showToast({
        title: '请先选择头像',
        icon: 'none'
      })
      return
    }
    
    if (!this.data.nickName || this.data.nickName.trim() === '') {
      wx.showToast({
        title: '请先输入昵称',
        icon: 'none'
      })
      return
    }
    
    // 构建用户信息
    this.setData({
      userInfo: {
        avatarUrl: this.data.avatarUrl,
        nickName: this.data.nickName.trim()
      }
    })
    
    console.log('用户信息准备完成:', this.data.userInfo)
  },

  // 获取手机号回调
  onGetPhoneNumber: function (e) {
    console.log('手机号授权结果:', e)
    
    // 先验证用户是否已经填写了头像和昵称
    if (!this.data.avatarUrl || this.data.avatarUrl === defaultAvatarUrl) {
      wx.showToast({
        title: '请先选择头像',
        icon: 'none'
      })
      return
    }
    
    if (!this.data.nickName || this.data.nickName.trim() === '') {
      wx.showToast({
        title: '请先输入昵称',
        icon: 'none'
      })
      return
    }
    
    // 构建用户信息
    const userInfo = {
      avatarUrl: this.data.avatarUrl,
      nickName: this.data.nickName.trim()
    }
    
    this.setData({
      userInfo: userInfo
    })
    
    if (e.detail.errMsg === 'getPhoneNumber:ok') {
      // 手机号获取成功
      const phoneCode = e.detail.code
      this.decodePhoneNumber(phoneCode)    } else {
      // 获取手机号失败，直接跳转到登记失败界面
      console.log('用户拒绝授权手机号或获取失败')
      wx.navigateTo({
        url: `/pages/result/result?success=false&communityName=${encodeURIComponent(this.data.communityName)}`
      })
    }
  },

  // 解析手机号（使用云函数）- 强制要求手机号
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
      } else {        // 获取手机号失败，直接跳转到登记失败界面
        console.log('获取手机号失败，详细错误：', res.result)
        wx.navigateTo({
          url: `/pages/result/result?success=false&communityName=${encodeURIComponent(this.data.communityName)}`
        })
      }
    }).catch(err => {
      wx.hideLoading()
      console.error('调用云函数失败：', err)
      
      let errorMessage = '云函数调用失败'
      if (err.errMsg && err.errMsg.includes('FunctionNotFound')) {
        errorMessage = '云函数未部署，请检查云开发配置'
      } else if (err.errCode === -604100) {
        errorMessage = '手机号获取权限未配置'
      }
        // 云函数调用失败，直接跳转到登记失败界面
      wx.navigateTo({
        url: `/pages/result/result?success=false&communityName=${encodeURIComponent(this.data.communityName)}`
      })
    })
  },

  // 保存访客信息到云数据库
  saveVisitorInfoToCloud: function (userInfo, phoneNumber) {
    wx.showLoading({
      title: '正在保存信息'
    })    // 调用云函数保存访客信息
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
        
        // 设置需要刷新访客列表的标志
        app.globalData.needRefreshVisitors = true
        
        wx.navigateTo({
          url: `/pages/result/result?success=true&communityName=${encodeURIComponent(this.data.communityName)}`
        })
      } else {
        // 根据错误类型显示不同的错误信息
        let errorMessage = '保存失败'
        if (res.result.error && res.result.error.includes('DATABASE_COLLECTION_NOT_EXIST')) {
          errorMessage = '数据库集合不存在，请先初始化数据库'
        } else if (res.result.message) {
          errorMessage = res.result.message
        }
        
        wx.showModal({
          title: '保存失败',
          content: errorMessage + '，请联系管理员或重试',
          showCancel: true,
          cancelText: '返回',
          confirmText: '重试',
          success: (modalRes) => {
            if (modalRes.confirm) {
              // 重试保存
              this.saveVisitorInfoToCloud(userInfo, phoneNumber)
            } else {
              wx.navigateTo({
                url: `/pages/result/result?success=false&communityName=${encodeURIComponent(this.data.communityName)}`
              })
            }
          }
        })
      }
    }).catch(err => {
      wx.hideLoading()
      console.error('调用保存云函数失败：', err)
      
      let errorMessage = '保存失败'
      if (err.errMsg && err.errMsg.includes('FunctionNotFound')) {
        errorMessage = '云函数未部署，请检查云开发配置'
      }
      
      wx.showModal({
        title: '保存失败',
        content: errorMessage + '，请联系管理员或重试',
        showCancel: true,
        cancelText: '返回',
        confirmText: '重试',
        success: (modalRes) => {
          if (modalRes.confirm) {
            // 重试保存
            this.saveVisitorInfoToCloud(userInfo, phoneNumber)
          } else {
            wx.navigateTo({
              url: `/pages/result/result?success=false&communityName=${encodeURIComponent(this.data.communityName)}`
            })
          }
        }
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
