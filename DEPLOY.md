# 辰航卓越 CRM 部署指南

## 目录

- [环境架构说明](#环境架构说明)
- [快速启动（Docker Compose 生产环境）](#快速启动docker-compose-生产环境)
- [本地开发环境](#本地开发环境)
- [环境变量说明](#环境变量说明)
- [数据库迁移](#数据库迁移)
- [数据库备份与恢复](#数据库备份与恢复)
- [更新与回滚](#更新与回滚)
- [故障排查](#故障排查)

---

## 环境架构说明

本项目采用 **开发/生产数据库完全隔离** 的架构：

| 环境 | 数据库容器 | 宿主机端口 | 访问范围 | 说明 |
|------|-----------|-----------|---------|------|
| **生产** | `crm-db-prod` | 不暴露 | Docker 内部网络 only | 仅 `crm-app-prod` 容器可访问 |
| **开发** | `crm-db-dev` | `127.0.0.1:5434` | 本机开发后端 | 完全独立的数据库实例 |

> ⚠️ **为什么隔离？** 之前开发数据库和生产数据库共用同一个 PostgreSQL 实例，导致本地数据修改直接影响生产数据。现在两者完全独立，互不干扰。

---

## 快速启动（Docker Compose 生产环境）

### 1. 服务器准备

推荐配置：
- **CPU**: 2 核+
- **内存**: 4GB+
- **磁盘**: 20GB+ SSD
- **系统**: Ubuntu 22.04 LTS / CentOS 8 / Debian 12

### 2. 安装 Docker

```bash
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker $USER
newgrp docker
```

### 3. 拉取代码并配置

```bash
git clone git@github.com:fmmf3537/CRM.git
cd CRM

# 生成强密码（务必修改！）
openssl rand -base64 32

# 创建环境文件（生产环境通过此文件配置）
cat > .env << 'EOF'
DATABASE_URL="postgresql://postgres:postgres@db:5432/crm?schema=public"
JWT_SECRET=your-strong-secret-here-change-it
EOF
```

> ⚠️ **安全警告**：`JWT_SECRET` 必须使用随机生成的强密码，泄露后任何人可伪造登录凭证。

### 4. 启动服务

```bash
docker-compose up --build -d
```

服务组成：

| 服务 | 容器名 | 端口 | 说明 |
|------|--------|------|------|
| `app` | `crm-app-prod` | `3006` | CRM 后端 + 前端 |
| `db` | `crm-db-prod` | 不暴露 | PostgreSQL 16，仅内部访问 |

```bash
# 查看日志
docker-compose logs -f app
docker-compose logs -f db

# 查看状态
docker-compose ps
```

### 5. 验证部署

```bash
curl http://localhost:3006/api/health
# 应返回 {"status":"ok","time":"..."}
```

浏览器访问：`http://<服务器IP>:3006`

默认账号：

| 角色 | 用户名 | 密码 |
|------|--------|------|
| 管理员 | `admin` | `password` |
| 销售 | `sales1` | `password` |

> ⚠️ 首次登录后请立即修改默认密码。

---

## 本地开发环境

### 启动开发数据库

```bash
# 启动独立的开发数据库容器（端口 5434）
docker-compose -f docker-compose.dev.yml up -d db-dev
```

### 配置开发环境变量

项目已提供 `.env.development`，本地开发时加载：

**PowerShell:**
```powershell
$env:DATABASE_URL="postgresql://postgres:postgres@localhost:5434/crm_dev?schema=public"
npm run server
```

**CMD:**
```cmd
set DATABASE_URL=postgresql://postgres:postgres@localhost:5434/crm_dev?schema=public
npm run server
```

> 默认 `.env` 文件已指向开发数据库（5434），直接 `npm run server` 即可连接开发环境。

### 开发数据库迁移

```bash
# 应用迁移到开发数据库
$env:DATABASE_URL="postgresql://postgres:postgres@localhost:5434/crm_dev?schema=public"
npx prisma migrate deploy
```

### 停止开发环境

```bash
docker-compose -f docker-compose.dev.yml down
```

---

## 环境变量说明

| 变量 | 必填 | 默认值 | 说明 |
|------|------|--------|------|
| `DATABASE_URL` | **是** | - | PostgreSQL 连接字符串 |
| `JWT_SECRET` | **是** | - | JWT 签名密钥，**必须修改** |
| `PORT` | 否 | `3006` | 服务监听端口 |
| `NODE_ENV` | 否 | `development` | 运行环境 |

### 各环境 DATABASE_URL 格式

**生产环境（Docker Compose）:**
```
postgresql://postgres:postgres@db:5432/crm?schema=public
```
`db` 是 docker-compose 内 PostgreSQL 服务的名称（内部 DNS 解析）。

**本地开发环境:**
```
postgresql://postgres:postgres@localhost:5434/crm_dev?schema=public
```
`5434` 是开发数据库映射到宿主机的端口。

---

## 数据库迁移

### 首次部署（生产环境）

首次启动时，数据库是空的。进入 app 容器执行迁移：

```bash
docker-compose exec app npx prisma migrate deploy
```

> 生产环境建议使用 `prisma migrate deploy`，它会应用已创建的迁移文件，不会修改 schema。

### 开发环境迁移

开发中修改了 `prisma/schema.prisma` 后：

```bash
# 创建新迁移
npx prisma migrate dev --name 描述名称

# 同步到数据库（不创建迁移文件）
npx prisma db push
```

### 查看数据库

```bash
# 生产环境：进入 PostgreSQL 容器
docker-compose exec db psql -U postgres -d crm -c "\dt"

# 开发环境：直接连接
docker exec crm-db-dev psql -U postgres -d crm_dev -c "\dt"
```

---

## 数据库备份与恢复

### 生产环境备份

```bash
# 导出 SQL（注意：使用 docker-compose exec -T 避免 TTY 问题）
docker-compose exec -T db pg_dump -U postgres -d crm > crm_backup.sql
```

### 恢复备份

```bash
# 停止应用
docker-compose stop app

# 清空并恢复数据库
docker-compose exec -T db psql -U postgres -d crm -c "DROP SCHEMA public CASCADE; CREATE SCHEMA public;"
docker-compose exec -T db psql -U postgres -d crm < crm_backup.sql

# 重新启动
docker-compose up -d app
```

### 自动备份脚本

```bash
sudo tee /usr/local/bin/backup-crm.sh << 'EOF'
#!/bin/bash
BACKUP_DIR="/backup/crm"
DATE=$(date +%Y%m%d_%H%M%S)
mkdir -p "$BACKUP_DIR"

docker-compose exec -T db pg_dump -U postgres -d crm > "$BACKUP_DIR/crm_$DATE.sql"

# 保留最近 30 天
find "$BACKUP_DIR" -name "crm_*.sql" -mtime +30 -delete

echo "Backup completed: crm_$DATE.sql"
EOF

sudo chmod +x /usr/local/bin/backup-crm.sh

# 每日凌晨 2 点自动备份
crontab -l 2>/dev/null | { cat; echo "0 2 * * * /usr/local/bin/backup-crm.sh >> /var/log/crm-backup.log 2>&1"; } | crontab -
```

---

## 更新与回滚

### 更新应用

```bash
cd CRM
git pull origin main

# 重新构建并启动
docker-compose down
docker-compose up --build -d

# 应用新迁移（如有）
docker-compose exec app npx prisma migrate deploy
```

### 回滚

```bash
# 回退代码
git log --oneline -5
git checkout <commit-hash>

# 重新构建
docker-compose up --build -d
```

---

## 故障排查

### 容器无法启动

```bash
# 查看详细日志
docker-compose logs --tail=100 app

# 常见原因：
# 1. 端口被占用：sudo lsof -i :3006
# 2. 权限问题：sudo chown -R $USER:$USER data/
```

### 数据库连接失败

```bash
# 检查 PostgreSQL 是否运行
docker-compose exec db pg_isready -U postgres -d crm

# 检查环境变量
docker-compose exec app env | grep DATABASE
```

### 开发环境连不上数据库

```bash
# 检查开发数据库容器是否运行
docker ps | grep crm-db-dev

# 检查端口映射
docker port crm-db-dev
# 应显示 127.0.0.1:5434 -> 5432/tcp

# 测试连接
docker exec crm-db-dev pg_isready -U postgres -d crm_dev
```

### 迁移失败

```bash
# 重置迁移状态（开发环境慎用）
docker-compose exec app npx prisma migrate reset --force

# 仅部署已有迁移（生产环境）
docker-compose exec app npx prisma migrate deploy
```

### 清理磁盘空间

```bash
# 清理 Docker 缓存
docker system prune -a

# 清理旧备份
find /backup/crm -name "*.sql" -mtime +30 -delete
```

---

## 技术栈

- **前端**：React 19 + Vite + Tailwind CSS + React Router
- **后端**：Express + Prisma 6 + **PostgreSQL 16**
- **测试**：Jest + Supertest + Playwright
- **部署**：Docker + Docker Compose
