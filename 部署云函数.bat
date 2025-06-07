@echo off
echo ================================
echo 微信小程序访客登记系统 - 云函数部署脚本
echo ================================
echo.

echo [1/5] 开始部署 getPhoneNumber 云函数...
cd cloudfunctions\getPhoneNumber
call npm install
echo getPhoneNumber 依赖安装完成
cd ..\..

echo [2/5] 开始部署 saveVisitor 云函数...
cd cloudfunctions\saveVisitor
call npm install
echo saveVisitor 依赖安装完成
cd ..\..

echo [3/5] 开始部署 initDatabase 云函数...
cd cloudfunctions\initDatabase
call npm install
echo initDatabase 依赖安装完成
cd ..\..

echo [4/5] 开始部署 getVisitors 云函数...
cd cloudfunctions\getVisitors
call npm install
echo getVisitors 依赖安装完成
cd ..\..

echo [5/5] 开始部署 getPhoneNumberFallback 云函数...
cd cloudfunctions\getPhoneNumberFallback
call npm install
echo getPhoneNumberFallback 依赖安装完成
cd ..\..

echo.
echo ================================
echo 云函数依赖安装完成！
echo ================================
echo.
echo 下一步操作：
echo 1. 打开微信开发者工具
echo 2. 在项目中右键点击 cloudfunctions 文件夹
echo 3. 选择 "上传并部署：云端安装依赖"
echo 4. 等待所有云函数部署完成
echo.
echo 或者逐个部署云函数：
echo 1. 右键点击每个云函数文件夹
echo 2. 选择 "上传并部署：云端安装依赖"
echo.
pause
