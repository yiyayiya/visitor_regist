// 数据库初始化脚本
// 在微信开发者工具的云开发控制台中执行这些操作

// 1. 创建 visitors 集合
// 在云开发控制台 -> 数据库 -> 添加集合
// 集合名称：visitors

// 2. 设置数据库权限
// 建议权限设置：
// - 读权限：仅创建者可读
// - 写权限：仅创建者可写
// 或者使用自定义权限：
/*
{
  "read": true,
  "write": "auth.openid == resource.openid"
}
*/

// 3. 创建索引（可选，用于提高查询性能）
// 在 visitors 集合中创建以下索引：
// - communityName: 单字段索引
// - registerTime: 单字段索引（降序）
// - openid: 单字段索引

// 4. 插入测试数据（可选）
const testData = {
  openid: 'test-openid',
  appid: 'test-appid',
  avatarUrl: 'https://example.com/avatar.jpg',
  nickName: '测试用户',
  phoneNumber: '138****8888',
  communityName: '测试小区',
  areaName: '测试区域',
  cityName: '测试城市',
  registerTime: new Date(),
  _createTime: new Date()
}

// 在云开发控制台的数据库中手动添加上述测试数据
// 或者使用以下云函数代码进行初始化
