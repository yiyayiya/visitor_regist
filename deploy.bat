@echo off
echo ================================
echo 微信小程序云开发部署脚本
echo ================================
echo.

echo 请确保已完成以下步骤：
echo 1. 在微信开发者工具中打开项目
echo 2. 已开通云开发环境
echo 3. 已获取云环境ID并在app.js中配置
echo.

echo 部署步骤：
echo 1. 在微信开发者工具中右键点击 cloudfunctions/getPhoneNumber
echo 2. 选择"上传并部署：云端安装依赖"
echo 3. 等待部署完成
echo.
echo 4. 在微信开发者工具中右键点击 cloudfunctions/saveVisitor  
echo 5. 选择"上传并部署：云端安装依赖"
echo 6. 等待部署完成
echo.
echo 7. 在微信开发者工具中右键点击 cloudfunctions/getVisitors
echo 8. 选择"上传并部署：云端安装依赖" 
echo 9. 等待部署完成
echo.

echo 配置云数据库：
echo 1. 在云开发控制台创建 visitors 集合
echo 2. 设置合适的数据库权限
echo.

echo ================================
echo 部署完成后可以测试功能
echo ================================
pause
