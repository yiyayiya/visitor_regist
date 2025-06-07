// pages/admin/visitorList.js
Page({
  data: {
    visitors: [],
    filteredVisitors: [],
    filterCommunity: '',
    loading: false
  },
  
  onLoad: function () {
    // 加载访客数据
    this.loadVisitors()
  },

  // 从云数据库加载访客数据
  loadVisitors: function () {
    this.setData({ loading: true })
    
    wx.cloud.callFunction({
      name: 'getVisitors',
      data: {
        communityName: this.data.filterCommunity
      }
    }).then(res => {
      console.log('获取访客列表结果：', res.result)
      
      if (res.result.success) {
        const visitors = res.result.data
        this.setData({
          visitors: visitors,
          filteredVisitors: visitors,
          loading: false
        })
        
        // 同时更新全局数据
        const app = getApp()
        app.globalData.visitors = visitors
      } else {
        wx.showToast({
          title: res.result.message || '加载失败',
          icon: 'none'
        })
        this.setData({ loading: false })
      }
    }).catch(err => {
      console.error('调用获取访客列表云函数失败：', err)
      wx.showToast({
        title: '加载失败',
        icon: 'none'
      })
      this.setData({ loading: false })
      
      // 备用方案：从本地全局数据获取
      const app = getApp()
      this.setData({
        visitors: app.globalData.visitors,
        filteredVisitors: app.globalData.visitors
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

  // 刷新数据
  onRefresh: function () {
    this.loadVisitors()
  },

  // 下拉刷新
  onPullDownRefresh: function () {
    this.loadVisitors()
    wx.stopPullDownRefresh()
  }
})
