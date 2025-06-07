// 测试数据库初始化
// 在微信开发者工具控制台中运行此代码来初始化数据库

console.log('开始初始化数据库...')

// 调用数据库初始化云函数
wx.cloud.callFunction({
  name: 'initDatabase',
  data: {}
}).then(res => {
  console.log('数据库初始化结果：', res.result)
  if (res.result.success) {
    console.log('✅ 数据库初始化成功！现在可以测试访客注册了')
  } else {
    console.error('❌ 数据库初始化失败：', res.result.message)
  }
}).catch(err => {
  console.error('❌ 调用初始化云函数失败：', err)
})
