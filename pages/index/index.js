// pages/index/index.js
const util = require('../../utils/util.js')

// 默认头像
const defaultAvatarUrl = 'https://mmbiz.qpic.cn/mmbiz/icTdbqWNOwNRna42FI242Lcia07jQodd2FJGIYQfG0LAJGFxM4FbnQP6yfMxBgJ0F3YRqJCJ1aPAK2dQagdusBZg/0'

Page({  data: {
    communityName: '',
    areaName: '',
    cityName: '',
    formattedAddress: '', // 格式化后的地址信息
    avatarUrl: defaultAvatarUrl, // 用户头像
    defaultAvatarUrl: defaultAvatarUrl, // 默认头像URL，供WXML使用
    nickName: '', // 用户昵称
    phoneNumber: '', // 用户手机号
    userInfo: null, // 存储用户基本信息
    isFromCache: false // 标识是否从缓存加载
  },
  onLoad: function (options) {
    // 页面加载时，解析传入的参数
    let communityName = '', areaName = '', cityName = ''
    
    if (options.community_name && options.area_name && options.city_name) {
      communityName = decodeURIComponent(options.community_name)
      areaName = decodeURIComponent(options.area_name)  
      cityName = decodeURIComponent(options.city_name)
      
      this.setData({
        communityName: communityName,
        areaName: areaName,
        cityName: cityName,
        formattedAddress: this.formatAddress(cityName, areaName, communityName)
      })
      
      // 动态设置导航栏标题
      wx.setNavigationBarTitle({
        title: communityName || '访客登记'
      })
    } else {
      // 没有地址信息时的处理
      this.setData({
        formattedAddress: this.formatAddress('', '', '')
      })
    }
    
    // 加载缓存的用户信息
    this.loadCachedUserInfo()
  },// 加载缓存的用户信息
  loadCachedUserInfo: function() {
    try {
      const cachedUserInfo = wx.getStorageSync('cached_user_info')
      if (cachedUserInfo) {
        // 检查缓存是否过期
        if (this.isCacheExpired(cachedUserInfo)) {
          console.log('缓存已过期，清除缓存')
          wx.removeStorageSync('cached_user_info')
          return
        }
        
        console.log('发现缓存的用户信息:', cachedUserInfo)
        
        // 检查缓存的头像URL是否为临时URL，如果是则需要重新获取
        let avatarUrl = cachedUserInfo.avatarUrl || defaultAvatarUrl
        const isTemporaryUrl = avatarUrl.includes('wxfile://') || 
                              avatarUrl.includes('http://tmp/') || 
                              avatarUrl.includes('tmp_')
        
        if (isTemporaryUrl) {
          console.log('检测到缓存头像为临时URL，使用默认头像:', avatarUrl)
          avatarUrl = defaultAvatarUrl
          // 清除缓存中的临时头像URL
          this.clearCachedUserInfo()
          return
        }
        
        this.setData({
          avatarUrl: avatarUrl,
          nickName: cachedUserInfo.nickName || '',
          phoneNumber: cachedUserInfo.phoneNumber || '',
          isFromCache: true
        })
        
        // 如果有完整的用户信息，显示提示
        if (cachedUserInfo.nickName && cachedUserInfo.phoneNumber) {
          wx.showToast({
            title: '已加载上次信息',
            icon: 'success',
            duration: 2000
          })
        }
      }
    } catch (e) {
      console.log('读取缓存用户信息失败:', e)
    }
  },

  // 保存用户信息到缓存
  saveCachedUserInfo: function(userInfo, phoneNumber) {
    try {
      const cacheData = {
        avatarUrl: userInfo.avatarUrl,
        nickName: userInfo.nickName,
        phoneNumber: phoneNumber,
        lastUpdateTime: new Date().getTime()
      }
      wx.setStorageSync('cached_user_info', cacheData)
      console.log('用户信息已保存到缓存:', cacheData)
    } catch (e) {
      console.log('保存用户信息到缓存失败:', e)
    }
  },

  // 清除缓存的用户信息
  clearCachedUserInfo: function() {
    try {
      wx.removeStorageSync('cached_user_info')
      this.setData({
        avatarUrl: defaultAvatarUrl,
        nickName: '',
        phoneNumber: '',
        isFromCache: false
      })
      wx.showToast({
        title: '已清除缓存信息',
        icon: 'success'
      })
      console.log('缓存用户信息已清除')
    } catch (e) {
      console.log('清除缓存用户信息失败:', e)
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
    // 如果有缓存的用户信息且完整，直接使用缓存信息进行登记
    if (this.data.isFromCache && this.data.nickName && this.data.phoneNumber) {
      const userInfo = {
        avatarUrl: this.data.avatarUrl,
        nickName: this.data.nickName.trim()
      }
      this.saveVisitorInfoToCloud(userInfo, this.data.phoneNumber)
      return
    }
    
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
    
    // 如果有缓存的手机号且用户基本信息完整，直接使用缓存
    if (this.data.isFromCache && this.data.phoneNumber && 
        this.data.avatarUrl && this.data.avatarUrl !== defaultAvatarUrl && 
        this.data.nickName && this.data.nickName.trim() !== '') {
      
      const userInfo = {
        avatarUrl: this.data.avatarUrl,
        nickName: this.data.nickName.trim()
      }
      this.saveVisitorInfoToCloud(userInfo, this.data.phoneNumber)
      return
    }
    
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
        
        // 先保存访客信息到云端（包括头像转存）
        this.saveVisitorInfoToCloud(this.data.userInfo, phoneNumber)
      } else {// 获取手机号失败，直接跳转到登记失败界面
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
    })
    
    // 先处理头像上传（如果是临时文件）
    this.uploadAvatarIfNeeded(userInfo.avatarUrl).then(finalAvatarUrl => {
      console.log('头像处理完成，最终URL:', finalAvatarUrl)
      
      // 调用云函数保存访客信息
      return wx.cloud.callFunction({
        name: 'saveVisitor',
        data: {
          avatarUrl: finalAvatarUrl,
          nickName: userInfo.nickName,
          phoneNumber: phoneNumber,
          communityName: this.data.communityName,
          areaName: this.data.areaName,
          cityName: this.data.cityName
        }
      })
    }).then(res => {
      wx.hideLoading()
      console.log('保存访客信息结果：', res.result)
      
      if (res.result.success) {
        // 保存成功后，使用云端返回的数据（包含云存储头像URL）保存到缓存
        const savedData = res.result.data
        if (savedData && savedData.avatarUrl) {
          // 使用云存储头像URL更新用户信息缓存
          const userInfoWithCloudAvatar = {
            avatarUrl: savedData.avatarUrl, // 使用云存储URL
            nickName: savedData.nickName
          }
          this.saveCachedUserInfo(userInfoWithCloudAvatar, phoneNumber)
          console.log('已使用云存储头像URL更新缓存:', savedData.avatarUrl)
        }
        
        // 同时保存到本地全局数据（为了管理员界面显示）
        const app = getApp()
        app.globalData.visitors.push(savedData)
        
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
  },

  // 检查缓存是否过期（可选功能，7天过期）
  isCacheExpired: function(cacheData) {
    if (!cacheData || !cacheData.lastUpdateTime) {
      return true
    }
    
    const now = new Date().getTime()
    const cacheTime = cacheData.lastUpdateTime
    const expireTime = 7 * 24 * 60 * 60 * 1000 // 7天
    
    return (now - cacheTime) > expireTime
  },

  // 页面显示时刷新缓存状态
  onShow: function() {
    // 重新检查缓存状态，以防用户在其他地方清除了缓存
    this.loadCachedUserInfo()
  },
    // 处理头像上传（如果需要的话）
  uploadAvatarIfNeeded: function(avatarUrl) {
    return new Promise((resolve, reject) => {
      console.log('检查头像URL是否需要上传:', avatarUrl)
      
      // 如果是默认头像或已经是云存储URL，直接返回
      if (!avatarUrl || 
          avatarUrl === defaultAvatarUrl || 
          avatarUrl.includes('cloud://') || 
          avatarUrl.includes('.tcb.qcloud.la')) {
        console.log('头像无需上传，直接使用:', avatarUrl)
        resolve(avatarUrl)
        return
      }
      
      // 如果是 wxfile:// 临时文件，需要先上传到云存储
      if (avatarUrl.startsWith('wxfile://')) {
        console.log('检测到临时文件，开始上传到云存储...')
        wx.showLoading({
          title: '正在上传头像'
        })
        
        // 生成云存储文件路径
        const timestamp = Date.now()
        const cloudPath = `avatars/user_${timestamp}.jpg`
        
        wx.cloud.uploadFile({
          cloudPath: cloudPath,
          filePath: avatarUrl
        }).then(uploadResult => {
          wx.hideLoading()
          console.log('头像上传到云存储成功:', uploadResult.fileID)
          resolve(uploadResult.fileID)
        }).catch(uploadError => {
          wx.hideLoading()
          console.error('头像上传失败:', uploadError)
          // 上传失败时使用原始URL，不阻断流程
          console.log('头像上传失败，使用原始URL继续流程')
          resolve(avatarUrl)
        })
      } else {
        // 其他类型的URL（https等）直接使用
        console.log('使用原始头像URL:', avatarUrl)
        resolve(avatarUrl)
      }
    })
  },  // 格式化地址信息
  formatAddress: function(cityName, areaName, communityName) {
    const parts = []
    
    // 如果有小区名称，只显示城市和区域
    if (communityName && communityName.trim()) {
      if (cityName && cityName.trim()) {
        parts.push(cityName.trim())
      }
      if (areaName && areaName.trim()) {
        parts.push(areaName.trim())
      }
      return parts.length > 0 ? parts.join(' / ') : ''
    }
    
    // 如果没有小区名称，显示所有可用信息或者"小区信息为空"
    if (cityName && cityName.trim()) {
      parts.push(cityName.trim())
    }
    if (areaName && areaName.trim()) {
      parts.push(areaName.trim())
    }
    
    return parts.length > 0 ? parts.join(' / ') : '小区信息为空'
  }
})
