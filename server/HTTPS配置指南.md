# HTTPS配置操作指南

## 当前问题
❌ http://cryptowatch.sifuture.cn 无法使用麦克风  
✅ 原因：现代浏览器只允许HTTPS或localhost使用麦克风  
🔐 解决方案：配置SSL证书，启用HTTPS

## 域名状态
✅ cryptowatch.sifuture.cn → 47.97.121.208 （解析正常）  
✅ certbot 1.21.0 已安装  
✅ nginx正在运行

---

## 🎯 操作步骤（需要你协助输入密码）

### 步骤1：SSH登录服务器
```bash
ssh diana@47.97.121.208
# 密码：a
```

### 步骤2：申请SSL证书
登录后执行以下命令：

```bash
sudo certbot --nginx -d cryptowatch.sifuture.cn --email admin@sifuture.cn --agree-tos --redirect --non-interactive
```

**说明：**
- `--nginx`: 自动配置nginx
- `-d cryptowatch.sifuture.cn`: 域名
- `--email`: 证书通知邮箱（可以改成你的）
- `--agree-tos`: 同意服务条款
- `--redirect`: 自动将HTTP重定向到HTTPS
- `--non-interactive`: 非交互模式

**预期结果：**
```
Congratulations! You have successfully enabled HTTPS on https://cryptowatch.sifuture.cn
```

### 步骤3：验证配置
```bash
# 检查nginx配置
sudo nginx -t

# 查看证书信息
sudo certbot certificates

# 检查HTTPS端口
sudo netstat -tlnp | grep :443
```

### 步骤4：测试访问
在浏览器打开：
```
https://cryptowatch.sifuture.cn
```

应该看到：
- 🔒 地址栏显示安全锁图标
- ✅ 可以授权麦克风权限
- ✅ 语音对话功能正常

---

## 🔧 备选方案（如果自动配置失败）

### 手动配置nginx支持HTTPS

1. 先申请证书（仅申请，不自动配置）：
```bash
sudo certbot certonly --nginx -d cryptowatch.sifuture.cn
```

2. 手动编辑nginx配置：
```bash
sudo nano /etc/nginx/sites-available/cryptowatch
```

添加HTTPS配置：
```nginx
server {
    listen 80;
    server_name cryptowatch.sifuture.cn;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name cryptowatch.sifuture.cn;

    ssl_certificate /etc/letsencrypt/live/cryptowatch.sifuture.cn/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/cryptowatch.sifuture.cn/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;

    access_log /var/log/nginx/cryptowatch-access.log;
    error_log /var/log/nginx/cryptowatch-error.log;

    location /api/ {
        proxy_pass http://127.0.0.1:8080;
        proxy_http_version 1.1;
        
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        proxy_buffering off;
        proxy_cache off;
        proxy_read_timeout 300s;
        
        add_header 'Access-Control-Allow-Origin' '*' always;
        add_header 'Access-Control-Allow-Methods' 'GET, POST, OPTIONS' always;
        add_header 'Access-Control-Allow-Headers' 'Content-Type, Authorization' always;
    }

    location / {
        root /var/www/CryptoWatchDemo/public;
        index index.html;
        try_files $uri $uri/ /index.html;
        
        add_header 'Access-Control-Allow-Origin' '*' always;
    }
}
```

3. 测试并重载：
```bash
sudo nginx -t
sudo systemctl reload nginx
```

---

## 📋 证书自动续期

Let's Encrypt证书有效期90天，certbot会自动续期。

测试自动续期：
```bash
sudo certbot renew --dry-run
```

查看续期定时任务：
```bash
sudo systemctl status certbot.timer
```

---

## ✅ 验证清单

执行完成后检查：
- [ ] `https://cryptowatch.sifuture.cn` 可以访问
- [ ] 浏览器显示安全锁图标
- [ ] 可以点击"开始对话"授权麦克风
- [ ] 录音功能正常
- [ ] API接口全部正常

---

## 🚨 可能的问题

### 问题1：80端口被阻止
**症状：** certbot失败，提示无法验证域名  
**解决：** 检查阿里云安全组是否开放80端口

### 问题2：443端口未开放
**症状：** HTTPS无法访问  
**解决：** 在阿里云安全组添加443端口入站规则

### 问题3：nginx配置错误
**症状：** nginx -t 报错  
**解决：** 检查配置文件语法，恢复备份

---

**下一步：请按照步骤1-4执行，有任何错误告诉我！**
