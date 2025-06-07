const formatTime = date => {
  const year = date.getFullYear()
  const month = date.getMonth() + 1
  const day = date.getDate()
  const hour = date.getHours()
  const minute = date.getMinutes()
  const second = date.getSeconds()
  return `${[year, month, day].map(formatNumber).join('/')} ${[hour, minute, second].map(formatNumber).join(':')}`
}

const formatNumber = n => {
  n = n.toString()
  return n[1] ? n : `0${n}`
}

// 解析手机号的工具函数
const decodePhoneNumber = (code) => {
  return new Promise((resolve, reject) => {
    // 这里应该调用你的后端接口来解析手机号
    // 示例：
    wx.request({
      url: 'https://your-backend-api.com/decode-phone', // 替换为你的后端接口
      method: 'POST',
      data: {
        code: code
      },
      success: (res) => {
        if (res.data && res.data.phoneNumber) {
          resolve(res.data.phoneNumber)
        } else {
          reject(new Error('解析手机号失败'))
        }
      },
      fail: (err) => {
        reject(err)
      }
    })
  })
}

// 网络请求封装
const request = (options) => {
  return new Promise((resolve, reject) => {
    wx.request({
      url: options.url,
      method: options.method || 'GET',
      data: options.data || {},
      header: {
        'content-type': 'application/json',
        ...options.header
      },
      success: (res) => {
        if (res.statusCode === 200) {
          resolve(res.data)
        } else {
          reject(new Error(`请求失败：${res.statusCode}`))
        }
      },
      fail: (err) => {
        reject(err)
      }
    })
  })
}

module.exports = {
  formatTime,
  decodePhoneNumber,
  request
}
