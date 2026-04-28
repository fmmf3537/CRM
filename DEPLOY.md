# CRM 系统生产环境部署指南

## 目录

- [方案一：Docker Compose 快速部署（推荐）](#方案一docker-compose-快速部署)
- [方案二：手动部署到云服务器](#方案二手动部署到云服务器)
- [HTTPS 配置](#https-配置)
- [数据库备份与恢复](#数据库备份与恢复)
- [更新与回滚](#更新与回滚)
- [环境变量说明](#环境变量说明)
- [故障排查](#故障排查)

---

## 方案一：Docker Compose 快速部署（推荐）

### 1. 服务器准备

推荐配置：
- **CPU**: 2 核+
- **内存**: 4GB+
- **磁盘**: 20GB+ SSD
- **系统**: Ubuntu 22.04 LTS / CentOS 8 / Debian 12

### 2. 安装 Docker

```bash
# Ubuntu / Debian
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker $USER
newgrp docker

# 验证
docker --version
docker-compose --version
```

### 3. 拉取代码

```bash
git clone <your-repo-url> crm
cd crm
```

### 4. 配置环境变量

```bash
# 生成强密码（务必修改！）
openssl rand -base64 32

# 创建环境文件
cat > .env << 'EOF'
JWT_SECRET=your-strong-secret-here-change-it
EOF
```

> ⚠️ **安全警告**：`JWT_SECRET` 必须使用随机生成的强密码，泄露后任何人可伪造登录凭证。

### 5. 启动服务

```bash
# 构建并后台启动
docker-compose up --build -d

# 查看日志
docker-compose logs -f app

# 查看运行状态
docker-compose ps
```

### 6. 验证部署

```bash
# 健康检查
curl http://localhost/api/health

# 应返回：{"status":"ok","time":"..."}
```

浏览器访问 `http://<服务器IP>`

默认账号：
| 角色 | 用户名 | 密码 |
|------|--------|------|
| 管理员 | `admin` | `password` |
| 销售 | `sales1` | `password` |

> ⚠️ 首次登录后请立即修改默认密码！

---

## 方案二：手动部署到云服务器

### 1. 环境准备

```bash
# Ubuntu 22.04
sudo apt update
sudo apt install -y nodejs npm nginx sqlite3

# 安装 Node 22（推荐）
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt install -y nodejs
node --version  # v22.x
```

### 2. 构建前端

```bash
cd crm
npm install
npx prisma generate
npm run build
# 产物在 dist/ 目录
```

### 3. 配置后端

```bash
# 安装生产依赖
npm ci

# 创建数据目录
mkdir -p data

# 配置环境变量
cat > .env << 'EOF'
NODE_ENV=production
PORT=3001
DATABASE_URL=file:./data/prod.db
JWT_SECRET=your-strong-secret-here-change-it
EOF
```

### 4. 使用 PM2 守护进程

```bash
sudo npm install -g pm2

# 启动（使用 tsx 运行 TypeScript）
pm2 start "npx tsx server/index.ts" --name crm-api

# 开机自启
pm2 startup
pm2 save

# 查看状态
pm2 status
pm2 logs crm-api
```

### 5. 配置 Nginx

```bash
sudo tee /etc/nginx/sites-available/crm << 'EOF'
server {
    listen 80;
    server_name your-domain.com;

    client_max_body_size 10m;

    location / {
        proxy_pass http://127.0.0.1:3001;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
EOF

sudo ln -s /etc/nginx/sites-available/crm /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

---

## HTTPS 配置

### 方式一：Let's Encrypt 免费证书（推荐）

```bash
sudo apt install -y certbot python3-certbot-nginx

# 申请证书（替换为你的域名）
sudo certbot --nginx -d your-domain.com

# 自动续期测试
sudo certbot renew --dry-run
```

### 方式二：手动证书

```bash
# 放置证书到 ssl 目录
mkdir -p ssl
cp your-cert.pem ssl/cert.pem
cp your-key.pem ssl/key.pem

# 取消 nginx.conf 中 HTTPS 配置的注释，重新加载
docker-compose restart nginx
```

---

## 数据库备份与恢复

### 自动备份脚本

```bash
sudo tee /usr/local/bin/backup-crm.sh << 'EOF'
#!/bin/bash
BACKUP_DIR="/backup/crm"
DB_FILE="/path/to/crm/data/prod.db"
DATE=$(date +%Y%m%d_%H%M%S)

mkdir -p "$BACKUP_DIR"

# 备份 SQLite 数据库
cp "$DB_FILE" "$BACKUP_DIR/prod_$DATE.db"

# 保留最近 30 天的备份
find "$BACKUP_DIR" -name "prod_*.db" -mtime +30 -delete

echo "Backup completed: prod_$DATE.db"
EOF

sudo chmod +x /usr/local/bin/backup-crm.sh

# 每日凌晨 2 点自动备份
crontab -l 2>/dev/null | { cat; echo "0 2 * * * /usr/local/bin/backup-crm.sh >> /var/log/crm-backup.log 2>&1"; } | crontab -
```

### 手动备份

```bash
# Docker 部署
docker-compose exec app sh -c "cp /app/data/prod.db /app/data/prod.db.backup.$(date +%Y%m%d)"

# 手动部署
cp data/prod.db data/prod.db.backup.$(date +%Y%m%d)
```

### 恢复备份

```bash
# 停止服务
docker-compose down

# 恢复数据文件
cp /backup/crm/prod_20260101_020000.db data/prod.db

# 重新启动
docker-compose up -d
```

---

## 更新与回滚

### 更新应用

```bash
cd crm
git pull origin main

# Docker 方式
docker-compose down
docker-compose up --build -d

# 手动方式
npm ci
npm run build
pm2 restart crm-api
```

### 回滚

```bash
# Docker 方式：回退到上一个镜像
docker-compose down
docker-compose up -d

# 或者恢复数据库后重新构建
cp data/prod.db.backup.xxx data/prod.db
docker-compose up --build -d
```

---

## 环境变量说明

| 变量 | 必填 | 默认值 | 说明 |
|------|------|--------|------|
| `PORT` | 否 | `3001` | 服务监听端口 |
| `NODE_ENV` | 否 | `development` | 运行环境 |
| `DATABASE_URL` | 否 | `file:./dev.db` | SQLite 数据库路径 |
| `JWT_SECRET` | **是** | - | JWT 签名密钥，**必须修改** |

---

## 故障排查

### 容器无法启动

```bash
# 查看详细日志
docker-compose logs --tail=100 app

# 常见原因：
# 1. 端口被占用：sudo lsof -i :3001
# 2. 权限问题：sudo chown -R $USER:$USER data/
```

### 数据库锁定

```bash
# 如果看到 "database is locked" 错误
# 停止服务后删除 WAL 文件
rm data/prod.db-journal data/prod.db-wal data/prod.db-shm 2>/dev/null
```

### 502 Bad Gateway

```bash
# 检查后端是否正常运行
curl http://127.0.0.1:3001/api/health

# 检查 Nginx 配置
sudo nginx -t
sudo systemctl status nginx
```

### 清理磁盘空间

```bash
# 清理 Docker 缓存
docker system prune -a

# 清理旧备份
find /backup/crm -name "*.db" -mtime +30 -delete
```

---

## 安全建议

1. **修改默认密码**：部署后立即修改 admin 和 sales1 的密码
2. **使用强 JWT_SECRET**：建议 32 位以上随机字符串
3. **启用 HTTPS**：生产环境必须使用 HTTPS
4. **防火墙配置**：只开放 80/443 端口
5. **定期备份**：数据库每日自动备份
6. **监控日志**：关注异常登录和错误日志

---

## 技术栈

- **前端**：React 19 + Vite + Tailwind CSS + React Router
- **后端**：Express + Prisma 6 + SQLite
- **测试**：Jest + Supertest + Playwright
- **部署**：Docker + Docker Compose + Nginx
