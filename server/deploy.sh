#!/bin/bash

# CryptoWatch服务器部署脚本
# 使用方法: chmod +x deploy.sh && ./deploy.sh

set -e  # 遇到错误立即退出

echo "=========================================="
echo "CryptoWatch 服务器部署"
echo "=========================================="

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 项目路径
PROJECT_DIR="/var/www/CryptoWatchDemo"
NGINX_CONF="/etc/nginx/sites-available/cryptowatch"
SERVICE_FILE="/etc/systemd/system/cryptowatch.service"

# 检查是否为root用户
if [ "$EUID" -ne 0 ]; then 
    echo -e "${RED}请使用sudo运行此脚本${NC}"
    exit 1
fi

# 1. 创建项目目录
echo -e "${YELLOW}[1/8] 创建项目目录...${NC}"
mkdir -p $PROJECT_DIR
mkdir -p /var/log/cryptowatch
chown -R diana:diana $PROJECT_DIR
chown -R diana:diana /var/log/cryptowatch

# 2. 安装依赖
echo -e "${YELLOW}[2/8] 检查Node.js和Python...${NC}"
if ! command -v node &> /dev/null; then
    echo -e "${RED}Node.js未安装，正在安装...${NC}"
    curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
    apt-get install -y nodejs
fi

if ! command -v python3 &> /dev/null; then
    echo -e "${RED}Python3未安装，正在安装...${NC}"
    apt-get update
    apt-get install -y python3 python3-pip
fi

echo -e "${GREEN}Node.js版本: $(node -v)${NC}"
echo -e "${GREEN}Python版本: $(python3 --version)${NC}"

# 3. 安装Python依赖
echo -e "${YELLOW}[3/8] 安装Python依赖...${NC}"
pip3 install aliyun-python-sdk-core==2.15.1

# 4. 安装Node.js依赖
echo -e "${YELLOW}[4/8] 安装Node.js依赖...${NC}"
cd $PROJECT_DIR
npm install https-proxy-agent

# 5. 复制文件
echo -e "${YELLOW}[4/8] 等待文件上传...${NC}"
echo "请在本地执行以下命令上传文件:"
echo ""
echo -e "${GREEN}scp server.js diana@47.97.121.208:/var/www/CryptoWatchDemo/${NC}"
echo -e "${GREEN}scp get_aliyun_token.py diana@47.97.121.208:/var/www/CryptoWatchDemo/${NC}"
echo ""
read -p "文件上传完成后按Enter继续..."

# 5. 配置systemd服务
echo -e "${YELLOW}[5/8] 配置systemd服务...${NC}"
if [ -f "./cryptowatch.service" ]; then
    cp ./cryptowatch.service $SERVICE_FILE
    systemctl daemon-reload
    systemctl enable cryptowatch.service
    echo -e "${GREEN}服务已配置${NC}"
else
    echo -e "${RED}cryptowatch.service文件不存在${NC}"
    exit 1
fi

# 6. 配置Nginx
echo -e "${YELLOW}[6/8] 配置Nginx...${NC}"
if ! command -v nginx &> /dev/null; then
    echo -e "${RED}Nginx未安装，正在安装...${NC}"
    apt-get install -y nginx
fi

if [ -f "./nginx-cryptowatch.conf" ]; then
    cp ./nginx-cryptowatch.conf $NGINX_CONF
    ln -sf $NGINX_CONF /etc/nginx/sites-enabled/cryptowatch
    nginx -t && systemctl reload nginx
    echo -e "${GREEN}Nginx已配置${NC}"
else
    echo -e "${RED}nginx-cryptowatch.conf文件不存在${NC}"
    exit 1
fi

# 7. 启动服务
echo -e "${YELLOW}[7/8] 启动服务...${NC}"
systemctl restart cryptowatch
sleep 2

# 8. 检查状态
echo -e "${YELLOW}[8/8] 检查服务状态...${NC}"
if systemctl is-active --quiet cryptowatch; then
    echo -e "${GREEN}✓ CryptoWatch服务运行正常${NC}"
else
    echo -e "${RED}✗ CryptoWatch服务启动失败${NC}"
    systemctl status cryptowatch
    exit 1
fi

if systemctl is-active --quiet nginx; then
    echo -e "${GREEN}✓ Nginx运行正常${NC}"
else
    echo -e "${RED}✗ Nginx启动失败${NC}"
    systemctl status nginx
    exit 1
fi

echo ""
echo "=========================================="
echo -e "${GREEN}部署完成！${NC}"
echo "=========================================="
echo ""
echo "服务信息:"
echo "  - 项目目录: $PROJECT_DIR"
echo "  - 日志目录: /var/log/cryptowatch/"
echo "  - 域名: http://cryptowatch.sifuture.cn"
echo ""
echo "常用命令:"
echo "  - 查看日志: tail -f /var/log/cryptowatch/server.log"
echo "  - 重启服务: sudo systemctl restart cryptowatch"
echo "  - 查看状态: sudo systemctl status cryptowatch"
echo "  - 重启Nginx: sudo systemctl reload nginx"
echo ""
echo "测试端点:"
echo "  curl http://localhost:8080/"
echo "  curl http://cryptowatch.sifuture.cn/api/crypto/latest"
echo ""
