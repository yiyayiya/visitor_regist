// pages/admin/visitorList.js
Page({
  data: {
    visitors: [],
    filteredVisitors: [],
    filterCommunity: '',
    loading: false,
    showSearchModal: false, // 控制搜索弹窗显示
    // 分页相关数据
    pageSize: 50, // 每页加载50条数据
    currentPage: 0, // 当前页码
    hasMore: true, // 是否还有更多数据
    loadingMore: false // 是否正在加载更多
  },
  
  onLoad: function () {
    // 加载访客数据
    this.loadVisitors()
    
    // 设置右上角按钮
    wx.setNavigationBarTitle({
      title: '访客列表管理'
    })
  },

  onShow: function () {
    // 页面显示时检查是否需要刷新数据
    const app = getApp()
    if (app.globalData.needRefreshVisitors) {
      this.loadVisitors()
      app.globalData.needRefreshVisitors = false
    }
  },

  onReady: function () {
    // 页面初次渲染完成，设置右上角按钮
    wx.setNavigationBarColor({
      frontColor: '#000000',
      backgroundColor: '#ffffff'
    })
  },

  // 由于微信小程序限制，我们将通过页面内的浮动按钮来实现搜索功能
  // 暂时移除导航栏按钮相关代码

  // 处理右上角菜单按钮点击
  onShareAppMessage: function () {
    return {
      title: '访客列表管理',
      path: '/pages/admin/visitorList'
    }
  },

  // 从云数据库加载访客数据
  loadVisitors: function (loadMore = false) {
    if (loadMore) {
      // 加载更多数据
      if (!this.data.hasMore || this.data.loadingMore) {
        return
      }
      this.setData({ loadingMore: true })
    } else {
      // 首次加载或刷新数据
      this.setData({ 
        loading: true,
        currentPage: 0,
        hasMore: true,
        visitors: [],
        filteredVisitors: []
      })
    }
    
    const skip = loadMore ? this.data.currentPage * this.data.pageSize : 0
    
    wx.cloud.callFunction({
      name: 'getVisitors',
      data: {
        communityName: this.data.filterCommunity,
        limit: this.data.pageSize,
        skip: skip
      }
    }).then(res => {
      console.log('获取访客列表结果：', res.result)
      
      if (res.result.success) {
        const newVisitors = res.result.data
        let allVisitors = []
        
        if (loadMore) {
          // 合并新数据到现有数据
          allVisitors = [...this.data.visitors, ...newVisitors]
        } else {
          // 首次加载，直接使用新数据
          allVisitors = newVisitors
        }
        
        // 检查是否还有更多数据
        const hasMore = res.result.hasMore || false
        
        // 处理头像URL，获取临时访问链接
        this.processAvatarUrls(allVisitors).then(processedVisitors => {
          // 为每个访客添加格式化后的时间和地址
          const visitorsWithFormattedData = processedVisitors.map(visitor => ({
            ...visitor,
            formattedTime: this.formatDateTime(visitor.registerTime || visitor._createTime),
            formattedAddress: this.formatAddress(visitor.cityName, visitor.areaName, visitor.communityName)
          }))
          
          this.setData({
            visitors: visitorsWithFormattedData,
            filteredVisitors: visitorsWithFormattedData,
            loading: false,
            loadingMore: false,
            currentPage: loadMore ? this.data.currentPage + 1 : 1,
            hasMore: hasMore
          })
          
          // 同时更新全局数据
          const app = getApp()
          app.globalData.visitors = visitorsWithFormattedData
          
          if (loadMore && newVisitors.length > 0) {
            wx.showToast({
              title: `已加载${newVisitors.length}条新数据`,
              icon: 'success',
              duration: 1500
            })
          }
        }).catch(error => {
          console.error('处理头像URL失败:', error)
          // 即使头像处理失败，也要显示访客列表，并格式化时间和地址
          const visitorsWithFormattedData = allVisitors.map(visitor => ({
            ...visitor,
            formattedTime: this.formatDateTime(visitor.registerTime || visitor._createTime),
            formattedAddress: this.formatAddress(visitor.cityName, visitor.areaName, visitor.communityName)
          }))
          
          this.setData({
            visitors: visitorsWithFormattedData,
            filteredVisitors: visitorsWithFormattedData,
            loading: false,
            loadingMore: false,
            currentPage: loadMore ? this.data.currentPage + 1 : 1,
            hasMore: hasMore
          })
        })
      } else {
        wx.showToast({
          title: res.result.message || '加载失败',
          icon: 'none'
        })
        this.setData({ 
          loading: false,
          loadingMore: false
        })
      }
    }).catch(err => {
      console.error('调用获取访客列表云函数失败：', err)
      
      if (!loadMore) {
        // 备用方案：从本地全局数据获取（仅在首次加载时）
        const app = getApp()
        const localVisitors = app.globalData.visitors || []
        
        if (localVisitors.length > 0) {
          this.setData({
            visitors: localVisitors,
            filteredVisitors: localVisitors,
            loading: false,
            hasMore: false
          })
          wx.showToast({
            title: '已加载本地数据',
            icon: 'success'
          })
        } else {
          this.setData({ loading: false })
          wx.showToast({
            title: '网络连接失败',
            icon: 'none'
          })
        }
      } else {
        this.setData({ loadingMore: false })
        wx.showToast({
          title: '加载更多失败',
          icon: 'none'
        })
      }
    })
  },

  // 处理头像URL，获取临时访问链接
  processAvatarUrls: function(visitors) {
    return new Promise((resolve, reject) => {
      // 收集所有需要处理的云存储头像URL
      const cloudFileList = []
      const fileIndexMap = new Map() // 记录文件URL对应的访客索引
      
      visitors.forEach((visitor, index) => {
        if (visitor.avatarUrl && 
            (visitor.avatarUrl.startsWith('cloud://') || visitor.avatarUrl.includes('.tcb.qcloud.la'))) {
          cloudFileList.push(visitor.avatarUrl)
          fileIndexMap.set(visitor.avatarUrl, index)
        }
      })
      
      if (cloudFileList.length === 0) {
        // 没有云存储文件，直接返回
        resolve(visitors)
        return
      }
      
      console.log('需要获取临时链接的文件:', cloudFileList)
      
      // 调用云函数获取临时访问链接
      wx.cloud.callFunction({
        name: 'getTempFileURL',
        data: {
          fileList: cloudFileList
        }
      }).then(res => {
        console.log('获取临时链接结果:', res.result)
        
        if (res.result.success && res.result.fileList) {
          // 更新访客数据中的头像URL
          const processedVisitors = [...visitors]
          
          res.result.fileList.forEach(file => {
            if (file.status === 0 && file.tempFileURL) {
              // 找到对应的访客并更新头像URL
              const visitorIndex = fileIndexMap.get(file.fileID)
              if (visitorIndex !== undefined) {
                processedVisitors[visitorIndex].displayAvatarUrl = file.tempFileURL
                console.log(`更新访客${visitorIndex}的头像URL:`, file.tempFileURL)
              }
            } else {
              console.warn('获取临时链接失败:', file)
            }
          })
          
          resolve(processedVisitors)
        } else {
          console.error('获取临时链接失败:', res.result)
          resolve(visitors) // 失败时返回原始数据
        }
      }).catch(error => {
        console.error('调用getTempFileURL云函数失败:', error)
        resolve(visitors) // 失败时返回原始数据
      })
    })
  },

  // 筛选功能
  onFilterInput: function (e) {
    const filterCommunity = e.detail.value
    this.setData({
      filterCommunity: filterCommunity
    })
    
    // 实时筛选本地数据
    if (filterCommunity.trim() === '') {
      this.setData({
        filteredVisitors: this.data.visitors
      })
    } else {
      const filteredVisitors = this.data.visitors.filter(visitor => 
        visitor.communityName && visitor.communityName.includes(filterCommunity)
      )
      this.setData({
        filteredVisitors: filteredVisitors
      })
    }
  },

  // 显示搜索弹窗
  showSearchModal: function () {
    this.setData({
      showSearchModal: true
    })
  },

  // 隐藏搜索弹窗
  hideSearchModal: function () {
    this.setData({
      showSearchModal: false
    })
  },

  // 搜索小区名称
  onSearchInput: function (e) {
    const filterCommunity = e.detail.value
    this.setData({
      filterCommunity: filterCommunity
    })
    this.applyFilters()
  },

  // 确认搜索
  confirmSearch: function () {
    this.hideSearchModal()
    this.applyFilters()
  },

  // 清空搜索
  clearSearch: function () {
    this.setData({
      filterCommunity: ''
    })
    this.applyFilters()
    this.hideSearchModal()
  },

  // 应用所有筛选条件
  applyFilters: function () {
    let filteredVisitors = this.data.visitors

    // 按小区名称筛选
    if (this.data.filterCommunity.trim() !== '') {
      filteredVisitors = filteredVisitors.filter(visitor => 
        visitor.communityName && visitor.communityName.includes(this.data.filterCommunity)
      )
    }

    this.setData({
      filteredVisitors: filteredVisitors
    })
  },

  // 刷新数据
  onRefresh: function () {
    this.loadVisitors()
  },

  // 下拉刷新
  onPullDownRefresh: function () {
    this.loadVisitors()
    // 延迟停止下拉刷新，确保用户能看到刷新动画
    setTimeout(() => {
      wx.stopPullDownRefresh()
    }, 1000)
  },

  // 上拉加载更多
  onReachBottom: function () {
    if (this.data.hasMore && !this.data.loadingMore) {
      this.loadVisitors(true)
    }
  },

  // 手动加载更多（用于scroll-view的上拉事件）
  onScrollToLower: function () {
    if (this.data.hasMore && !this.data.loadingMore) {
      this.loadVisitors(true)
    }
  },

  // 阻止事件冒泡
  preventBubble: function () {
    // 空函数，用于阻止冒泡
  },

  // 拨打电话功能
  onCallPhone: function (e) {
    const phone = e.currentTarget.dataset.phone
    
    if (!phone) {
      wx.showToast({
        title: '暂无电话号码',
        icon: 'none'
      })
      return
    }

    // 确认拨打电话
    wx.showModal({
      title: '拨打电话',
      content: `是否拨打电话：${phone}？`,
      success: (res) => {
        if (res.confirm) {
          wx.makePhoneCall({
            phoneNumber: phone,
            success: () => {
              console.log('拨打电话成功')
            },
            fail: (err) => {
              console.error('拨打电话失败：', err)
              wx.showToast({
                title: '拨打失败',
                icon: 'none'
              })
            }
          })
        }
      }
    })
  },

  // 头像加载错误处理
  onAvatarError: function (e) {
    const index = e.currentTarget.dataset.index
    console.log('头像加载失败，索引:', index, '错误:', e.detail)
    
    // 使用默认头像替换失败的头像
    const defaultAvatar = 'https://mmbiz.qpic.cn/mmbiz/icTdbqWNOwNRna42FI242Lcia07jQodd2FJGIYQfG0LAJGFxM4FbnQP6yfMxBgJ0F3YRqJCJ1aPAK2dQagdusBZg/0'
    
    // 更新对应访客的头像URL
    const updateKey = `filteredVisitors[${index}].avatarUrl`
    this.setData({
      [updateKey]: defaultAvatar
    })
    
    // 同时更新原始访客列表中的头像
    const visitorsUpdateKey = `visitors[${index}].avatarUrl`
    this.setData({
      [visitorsUpdateKey]: defaultAvatar
    })
  },

  // 格式化地址信息
  formatAddress: function(cityName, areaName, communityName) {
    const parts = []
    
    if (cityName && cityName.trim()) {
      parts.push(cityName.trim())
    }
    
    if (areaName && areaName.trim()) {
      parts.push(areaName.trim())
    }
    
    if (communityName && communityName.trim()) {
      parts.push(communityName.trim())
    }
    
    return parts.length > 0 ? parts.join('/') : '小区信息空'
  },

  // 格式化时间为 年月日 时分 格式
  formatDateTime: function(dateTime) {
    if (!dateTime) return ''
    
    let date
    if (typeof dateTime === 'string') {
      date = new Date(dateTime)
    } else if (dateTime instanceof Date) {
      date = dateTime
    } else {
      // 处理云开发的时间戳格式
      date = new Date(dateTime)
    }
    
    if (isNaN(date.getTime())) {
      return dateTime.toString() // 如果无法解析，返回原始值
    }
    
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    const hours = String(date.getHours()).padStart(2, '0')
    const minutes = String(date.getMinutes()).padStart(2, '0')
    
    return `${year}年${month}月${day}日 ${hours}点${minutes}分`
  }
})
