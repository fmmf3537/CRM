# 辰航卓越 CRM 部署指南

## 目录

- [快速启动（Docker Compose）](#快速启动docker-compose)
- [环境变量说明](#环境变量说明)
- [数据库迁移](#数据库迁移)
- [数据库备份与恢复](#数据库备份与恢复)
- [更新与回滚](#更新与回滚)
- [故障排查](#故障排查)

---

## 快速启动（Docker Compose）

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

# 创建环境文件
cat > .env << 'EOF'
DATABASE_URL="postgresql://crm:crm_password@db:5432/crm?schema=public"
JWT_SECRET=your-strong-secret-here-change-it
EOF
```

> ⚠️ **安全警告**：`JWT_SECRET` 必须使用随机生成的强密码，泄露后任何人可伪造登录凭证。

### 4. 启动服务

```bash
docker-compose up --build -d
```

服务组成：
| 服务 | 端口 | 说明 |
|------|------|------|
| `app` | 3001 | CRM 后端 + 前端 |
| `db` | 5432 (内部) | PostgreSQL 16 |

```bash
# 查看日志
docker-compose logs -f app
docker-compose logs -f db

# 查看状态
docker-compose ps
```

### 5. 验证部署

```bash
curl http://localhost:3001/api/health
# → {"status":"ok","time":"..."}
```

浏览器访问 `http://<服务器IP>:3001`

默认账号：
| 角色 | 用户名 | 密码 |
|------|--------|------|
| 管理员 | `admin` | `password` |
| 销售 | `sales1` | `password` |

> ⚠️ 首次登录后请立即修改默认密码！

---

## 环境变量说明

| 变量 | 必填 | 默认值 | 说明 |
|------|------|--------|------|
| `DATABASE_URL` | **是** | - | PostgreSQL 连接字符串 |
| `JWT_SECRET` | **是** | - | JWT 签名密钥，**必须修改** |
| `PORT` | 否 | `3001` | 服务监听端口 |
| `NODE_ENV` | 否 | `development` | 运行环境 |

### Docker 环境 DATABASE_URL 格式

```
postgresql://用户名:密码@db:5432/数据库名?schema=public
```

`db` 是 docker-compose 中 PostgreSQL 服务的名称（内部 DNS 解析）。

---

## 数据库迁移

### 首次部署

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
# 进入 PostgreSQL 容器
docker-compose exec db psql -U crm -d crm -c "\dt"
```

---

## 数据库备份与恢复

### 自动备份脚本

```bash
sudo tee /usr/local/bin/backup-crm.sh << 'EOF'
#!/bin/bash
BACKUP_DIR="/backup/crm"
DATE=$(date +%Y%m%d_%H%M%S)
mkdir -p "$BACKUP_DIR"

# pg_dump 备份
docker-compose exec -T db pg_dump -U crm -d crm > "$BACKUP_DIR/crm_$DATE.sql"

# 保留最近 30 天
find "$BACKUP_DIR" -name "crm_*.sql" -mtime +30 -delete

echo "Backup completed: crm_$DATE.sql"
EOF

sudo chmod +x /usr/local/bin/backup-crm.sh

# 每日凌晨 2 点自动备份
crontab -l 2>/dev/null | { cat; echo "0 2 * * * /usr/local/bin/backup-crm.sh >> /var/log/crm-backup.log 2>&1"; } | crontab -
```

### 手动备份

```bash
# 导出 SQL
docker-compose exec -T db pg_dump -U crm -d crm > crm_backup.sql
```

### 恢复备份

```bash
# 停止应用
docker-compose stop app

# 清空并恢复数据库
docker-compose exec -T db psql -U crm -d crm -c "DROP SCHEMA public CASCADE; CREATE SCHEMA public;"
docker-compose exec -T db psql -U crm -d crm < crm_backup.sql

# 重新启动
docker-compose up -d app
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
# 1. 端口被占用：sudo lsof -i :3001
# 2. 权限问题：sudo chown -R $USER:$USER data/
```

### 数据库连接失败

```bash
# 检查 PostgreSQL 是否运行
docker-compose exec db pg_isready -U crm -d crm

# 检查环境变量
docker-compose exec app env | grep DATABASE
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
