# HTTPS配置任务清单

## 🎯 当前任务：配置HTTPS解决麦克风权限问题

### 📊 问题诊断
✅ DNS解析正常：cryptowatch.sifuture.cn → 47.97.121.208  
✅ 80端口开放：HTTP访问正常  
✅ API正常工作：所有接口返回200  
❌ **443端口未开放：阻止HTTPS访问**

### ⚠️ 核心问题
浏览器安全策略：**只允许HTTPS或localhost使用麦克风**

---

## 📝 操作步骤

### 步骤1：开放443端口（阿里云控制台）

1. 登录：https://ecs.console.aliyun.com/
2. 找到服务器：47.97.121.208
3. 点击：安全组 → 配置规则 → 添加入站规则
4. 配置：
   ```
   端口范围: 443/443
   授权对象: 0.0.0.0/0
   协议类型: TCP
   描述: HTTPS
   ```
5. 保存

### 步骤2：验证端口开放

在PowerShell运行：
```powershell
cd C:\Users\25841\Desktop\watch\server-deploy
.\检查端口状态.ps1
```

预期结果应该显示：
```
[OK] Port 443 is open
```

### 步骤3：配置SSL证书

确认443端口开放后，运行：
```powershell
.\配置HTTPS.ps1
```

脚本会自动：
1. 备份nginx配置
2. 申请Let's Encrypt证书
3. 配置nginx支持HTTPS
4. 启用HTTP→HTTPS自动跳转
5. 重载nginx服务

**需要输入密码**：提示时输入 `a`

### 步骤4：验证HTTPS

浏览器打开：
```
https://cryptowatch.sifuture.cn
```

检查清单：
- [ ] 地址栏显示🔒安全锁
- [ ] 不再显示"不安全"警告
- [ ] 可以点击"开始对话"
- [ ] 浏览器提示授权麦克风
- [ ] 录音和语音对话功能正常

---

## 📂 相关文件

| 文件 | 说明 |
|------|------|
| `检查端口状态.ps1` | 诊断端口和防火墙 |
| `配置HTTPS.ps1` | 自动配置SSL证书 |
| `HTTPS配置指南.md` | 详细手动配置说明 |
| `setup-https.sh` | 服务器端配置脚本 |

---

## 🚨 可能的问题

### 问题1：certbot失败
**原因**：域名验证失败  
**检查**：确认443端口已在阿里云开放

### 问题2：证书申请被限制
**原因**：Let's Encrypt速率限制  
**解决**：等待1小时后重试

### 问题3：nginx配置错误
**恢复**：使用备份文件恢复  
**位置**：`/etc/nginx/sites-available/cryptowatch.backup.*`

---

**准备好了就开始步骤1！完成后告诉我结果。**
