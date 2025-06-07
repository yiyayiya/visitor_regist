# 微信小程序获取手机号API接口说明

## 概述
本小程序使用微信官方提供的`getPhoneNumber`接口来获取用户手机号。由于安全考虑，微信不会直接返回明文手机号，而是返回一个加密的`code`，需要通过后端接口来解析。

## 前端实现

### 1. WXML按钮配置
```xml
<button 
  class="register-btn" 
  open-type="getPhoneNumber" 
  bindgetphonenumber="onGetPhoneNumber">
  一键登记
</button>
```

### 2. JS事件处理
```javascript
onGetPhoneNumber: function (e) {
  if (e.detail.errMsg === 'getPhoneNumber:ok') {
    const code = e.detail.code
    // 调用后端接口解析手机号
    this.decodePhoneNumber(code)
  }
}
```

## 后端接口实现

### 接口地址
```
POST https://your-domain.com/api/decode-phone
```

### 请求参数
```json
{
  "code": "手机号获取凭证"
}
```

### 响应格式
```json
{
  "success": true,
  "phoneNumber": "13800138000",
  "message": "获取成功"
}
```

### 后端实现示例（Node.js）

```javascript
const axios = require('axios')

// 解析手机号接口
app.post('/api/decode-phone', async (req, res) => {
  try {
    const { code } = req.body
    const appid = 'your_appid'
    const secret = 'your_appsecret'
    
    // 1. 获取access_token
    const tokenResponse = await axios.get(
      `https://api.weixin.qq.com/cgi-bin/token?grant_type=client_credential&appid=${appid}&secret=${secret}`
    )
    
    const accessToken = tokenResponse.data.access_token
    
    // 2. 解析手机号
    const phoneResponse = await axios.post(
      `https://api.weixin.qq.com/wxa/business/getuserphonenumber?access_token=${accessToken}`,
      { code }
    )
    
    if (phoneResponse.data.errcode === 0) {
      const phoneNumber = phoneResponse.data.phone_info.phoneNumber
      res.json({
        success: true,
        phoneNumber: phoneNumber,
        message: '获取成功'
      })
    } else {
      res.json({
        success: false,
        message: '获取手机号失败'
      })
    }
  } catch (error) {
    res.json({
      success: false,
      message: '服务器错误'
    })
  }
})
```

### 后端实现示例（Python Flask）

```python
import requests
from flask import Flask, request, jsonify

app = Flask(__name__)

@app.route('/api/decode-phone', methods=['POST'])
def decode_phone():
    try:
        data = request.get_json()
        code = data.get('code')
        
        appid = 'your_appid'
        secret = 'your_appsecret'
        
        # 1. 获取access_token
        token_url = f'https://api.weixin.qq.com/cgi-bin/token?grant_type=client_credential&appid={appid}&secret={secret}'
        token_response = requests.get(token_url)
        access_token = token_response.json()['access_token']
        
        # 2. 解析手机号
        phone_url = f'https://api.weixin.qq.com/wxa/business/getuserphonenumber?access_token={access_token}'
        phone_response = requests.post(phone_url, json={'code': code})
        
        result = phone_response.json()
        if result['errcode'] == 0:
            phone_number = result['phone_info']['phoneNumber']
            return jsonify({
                'success': True,
                'phoneNumber': phone_number,
                'message': '获取成功'
            })
        else:
            return jsonify({
                'success': False,
                'message': '获取手机号失败'
            })
    except Exception as e:
        return jsonify({
            'success': False,
            'message': '服务器错误'
        })
```

## 小程序配置

### 1. 在utils/util.js中配置后端接口地址
```javascript
// 解析手机号的工具函数
const decodePhoneNumber = (code) => {
  return new Promise((resolve, reject) => {
    wx.request({
      url: 'https://your-backend-api.com/api/decode-phone', // 替换为你的后端接口
      method: 'POST',
      data: { code },
      success: (res) => {
        if (res.data && res.data.success) {
          resolve(res.data.phoneNumber)
        } else {
          reject(new Error('解析手机号失败'))
        }
      },
      fail: reject
    })
  })
}
```

### 2. 在pages/index/index.js中启用真实接口
取消注释以下代码：
```javascript
util.decodePhoneNumber(code)
  .then(phoneNumber => {
    wx.hideLoading()
    this.saveVisitorInfo(this.data.userInfo, phoneNumber)
  })
  .catch(err => {
    wx.hideLoading()
    console.error('解析手机号失败:', err)
    this.saveVisitorInfo(this.data.userInfo, '获取手机号失败')
  })
```

## 注意事项

1. **appid和secret**：需要在微信公众平台获取
2. **服务器域名**：需要在小程序后台配置合法域名
3. **HTTPS**：后端接口必须使用HTTPS
4. **频率限制**：微信接口有调用频率限制
5. **错误处理**：需要处理各种异常情况

## 测试步骤

1. 配置后端接口
2. 修改utils/util.js中的接口地址
3. 启用真实接口调用代码
4. 在小程序中测试获取手机号功能
