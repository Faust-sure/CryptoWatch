# CryptoWatch 服务器部署说明

## 📋 部署清单

### 需要上传的文件
1. `server.js` - Node.js服务器主文件
2. `get_aliyun_token.py` - 阿里云Token生成脚本
3. `cryptowatch.service` - systemd服务配置
4. `nginx-cryptowatch.conf` - Nginx配置
5. `deploy.sh` - 自动部署脚本

---

## 🚀 快速部署步骤

### 步骤1: 上传文件到服务器

在本地PowerShell中执行：

```powershell
# 进入部署文件夹
cd C:\Users\25841\Desktop\watch\server-deploy

# 上传所有文件
scp server.js diana@47.97.121.208:/var/www/CryptoWatchDemo/
scp ..\get_aliyun_token.py diana@47.97.121.208:/var/www/CryptoWatchDemo/
scp cryptowatch.service diana@47.97.121.208:/tmp/
scp nginx-cryptowatch.conf diana@47.97.121.208:/tmp/
scp deploy.sh diana@47.97.121.208:/tmp/
```

### 步骤2: SSH连接服务器

```bash
ssh diana@47.97.121.208
# 密码: a
```

### 步骤3: 运行部署脚本

```bash
cd /tmp
chmod +x deploy.sh
sudo ./deploy.sh
```

脚本会自动：
- ✅ 创建必要目录
- ✅ 安装Node.js和Python依赖
- ✅ 配置systemd服务
- ✅ 配置Nginx反向代理
- ✅ 启动所有服务

---

## 🔧 手动部署步骤（备选方案）

### 1. 安装依赖

```bash
# 更新系统
sudo apt update

# 安装Node.js 18
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# 安装Python依赖
sudo pip3 install aliyun-python-sdk-core==2.15.1

# 安装Nginx
sudo apt install -y nginx
```

### 2. 配置systemd服务

```bash
# 复制服务文件
sudo cp /tmp/cryptowatch.service /etc/systemd/system/

# 创建日志目录
sudo mkdir -p /var/log/cryptowatch
sudo chown diana:diana /var/log/cryptowatch

# 重载systemd
sudo systemctl daemon-reload

# 启用并启动服务
sudo systemctl enable cryptowatch
sudo systemctl start cryptowatch

# 查看状态
sudo systemctl status cryptowatch
```

### 3. 配置Nginx

```bash
# 复制配置文件
sudo cp /tmp/nginx-cryptowatch.conf /etc/nginx/sites-available/cryptowatch

# 创建软链接
sudo ln -s /etc/nginx/sites-available/cryptowatch /etc/nginx/sites-enabled/

# 测试配置
sudo nginx -t

# 重载Nginx
sudo systemctl reload nginx
```

### 4. 配置防火墙

```bash
# 开放端口（如果使用ufw）
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw reload
```

---

## 🌐 域名配置

### DNS设置

在域名控制台（sifuture.cn）添加A记录：

```
类型: A
主机记录: cryptowatch
记录值: 47.97.121.208
TTL: 600
```

等待DNS生效（5-10分钟）。

### 验证域名

```bash
# 测试DNS解析
ping cryptowatch.sifuture.cn

# 测试HTTP访问
curl http://cryptowatch.sifuture.cn/
curl http://cryptowatch.sifuture.cn/api/crypto/latest
```

---

## 📊 服务管理命令

### systemd服务

```bash
# 查看服务状态
sudo systemctl status cryptowatch

# 启动服务
sudo systemctl start cryptowatch

# 停止服务
sudo systemctl stop cryptowatch

# 重启服务
sudo systemctl restart cryptowatch

# 查看日志
sudo journalctl -u cryptowatch -f

# 查看服务日志文件
tail -f /var/log/cryptowatch/server.log
tail -f /var/log/cryptowatch/error.log
```

### Nginx

```bash
# 测试配置
sudo nginx -t

# 重载配置
sudo systemctl reload nginx

# 重启Nginx
sudo systemctl restart nginx

# 查看访问日志
tail -f /var/log/nginx/cryptowatch-access.log

# 查看错误日志
tail -f /var/log/nginx/cryptowatch-error.log
```

---

## 🔍 测试API端点

### 本地测试（服务器上）

```bash
# 健康检查
curl http://localhost:8080/

# 获取阿里云配置
curl http://localhost:8080/api/aliyun/config

# 获取加密货币数据
curl http://localhost:8080/api/crypto/latest

# TTS测试
curl "http://localhost:8080/api/aliyun/tts?text=你好&voice=xiaoyun" -o test.mp3
```

### 外网测试

```bash
# 从外网测试
curl http://cryptowatch.sifuture.cn/
curl http://cryptowatch.sifuture.cn/api/crypto/latest
```

---

## ⚠️ 故障排查

### 服务无法启动

```bash
# 查看详细日志
sudo journalctl -u cryptowatch -n 50

# 检查端口占用
sudo netstat -tlnp | grep 8080

# 手动运行测试
cd /var/www/CryptoWatchDemo
node server.js
```

### Nginx 502错误

```bash
# 检查服务是否运行
sudo systemctl status cryptowatch

# 检查Nginx配置
sudo nginx -t

# 查看Nginx错误日志
sudo tail -f /var/log/nginx/error.log
```

### CoinMarketCap API失败

```bash
# 测试代理连接
curl -x 212.236.217.152:12323 -U 14a53f35f80cb:aa2d6d3d1a https://pro-api.coinmarketcap.com/v1/cryptocurrency/listings/latest?start=1&limit=1

# 查看服务器日志
tail -f /var/log/cryptowatch/server.log | grep Crypto
```

---

## 🔒 SSL证书配置（可选）

### 使用Let's Encrypt免费证书

```bash
# 安装certbot
sudo apt install -y certbot python3-certbot-nginx

# 获取证书
sudo certbot --nginx -d cryptowatch.sifuture.cn

# 自动续期
sudo certbot renew --dry-run
```

证书获取后，Nginx会自动配置HTTPS。

---

## 📝 更新应用

### 更新服务器代码

```bash
# 本地上传新版本
scp server.js diana@47.97.121.208:/var/www/CryptoWatchDemo/

# 服务器上重启服务
ssh diana@47.97.121.208
sudo systemctl restart cryptowatch
```

### 更新阿里云Token

```bash
# SSH到服务器
ssh diana@47.97.121.208

# 进入项目目录
cd /var/www/CryptoWatchDemo

# 手动生成新Token
python3 get_aliyun_token.py --json

# 服务会自动使用新Token（24小时自动刷新）
```

---

## 📞 下一步

1. ✅ 执行部署脚本
2. ✅ 配置DNS域名
3. ✅ 测试所有API端点
4. ✅ 配置SSL证书（可选）
5. ✅ 更新uni-app配置，使用生产服务器地址

部署完成后，修改CryptoWatch项目中的配置：

```javascript
// CryptoWatch/utils/config.js
export const SERVER_CONFIG = {
    CURRENT: 'http://cryptowatch.sifuture.cn'  // 改为生产地址
}
```
