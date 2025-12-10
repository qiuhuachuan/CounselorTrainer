# 前端应用部署指南

## 项目信息
- 应用名称：AI Client 前端
- 技术栈：Vue 3 + TypeScript + Vite
- 部署方式：Docker + Nginx
- Node.js 版本：25

## 部署前准备

### 1. 环境要求
- Ubuntu 20.04+ 服务器
- Docker 20.10+ 
- Docker Compose 1.29+

### 2. 服务器配置
- IP地址：156.232.9.202
- 端口：80（HTTP）

## 部署步骤

### 步骤1：登录服务器
```bash
ssh root@156.232.9.202
```

### 步骤2：安装Docker和Docker Compose

#### 安装Docker
```bash
# 更新系统包
apt update && apt upgrade -y

# 安装依赖
apt install -y apt-transport-https ca-certificates curl gnupg-agent software-properties-common

# 添加Docker GPG密钥
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | apt-key add -

# 添加Docker仓库
add-apt-repository "deb [arch=amd64] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable"

# 安装Docker
apt update && apt install -y docker-ce docker-ce-cli containerd.io

# 启动Docker服务
systemctl start docker

# 设置Docker开机自启
systemctl enable docker
```

#### 安装Docker Compose
```bash
# 下载Docker Compose
curl -L "https://github.com/docker/compose/releases/download/v2.24.1/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose

# 赋予执行权限
chmod +x /usr/local/bin/docker-compose

# 验证安装
docker-compose --version
```

### 步骤3：拉取代码
```bash
# 创建项目目录
mkdir -p /opt/ai-client && cd /opt/ai-client

# 拉取代码
git clone https://github.com/qiuhuachuan/CounselorTrainer.git .
```

### 步骤4：构建和启动容器
```bash
# 构建并启动服务
docker-compose up -d --build

# 查看容器状态
docker-compose ps

# 查看日志
docker-compose logs -f
```

### 步骤5：验证部署

在浏览器中访问：
```
http://156.232.9.202
```

## 日常维护

### 重启服务
```bash
docker-compose restart
```

### 停止服务
```bash
docker-compose down
```

### 更新代码
```bash
# 拉取最新代码
git pull origin main

# 重新构建并启动
docker-compose up -d --build
```

### 查看容器日志
```bash
docker-compose logs -f
```

### 进入容器
```bash
docker-compose exec frontend sh
```

## 环境配置

### 环境变量

项目使用以下环境变量来区分开发和生产环境：

- **开发环境**：.env.development
  - VITE_API_BASE_URL=http://127.0.0.1:8000

- **生产环境**：.env.production  
  - VITE_API_BASE_URL=http://156.232.9.202:8000

### 静态资源

构建后的静态文件位于 `dist/` 目录，Nginx将从该目录提供静态资源。

## 常见问题处理

### 1. 端口被占用
```bash
# 检查端口占用情况
lsof -i :80

# 停止占用端口的进程
kill -9 <PID>
```

### 2. Docker服务无法启动
```bash
# 查看Docker服务状态
systemctl status docker

# 查看Docker日志
journalctl -u docker.service
```

### 3. 构建失败
```bash
# 清理缓存
docker system prune -f

# 重新构建
docker-compose up -d --build
```

### 4. 应用无法访问
```bash
# 检查防火墙设置
ufw status

# 如果防火墙开启，允许80端口
ufw allow 80
```

## 技术栈

- **前端框架**：Vue 3 + TypeScript
- **构建工具**：Vite
- **部署容器**：Docker
- **Web服务器**：Nginx
- **状态管理**：Pinia
- **HTTP客户端**：Fetch API

## 联系信息

如有部署问题，请联系技术支持。