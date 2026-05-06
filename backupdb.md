# CRM 数据库备份文档

> 本文档记录 CRM 系统的 PostgreSQL 数据库本地备份策略、脚本说明及恢复操作指南。
> 
> **部署日期**：2026-05-06  
> **数据库大小**：约 8.5 MB（生产环境）

---

## 一、备份策略概述

采用 **GFS（Grandfather-Father-Son）分层备份策略**，全部在本地执行，每日自动备份并校验。

| 层级 | 触发条件 | 保留周期 | 清理规则 |
|------|----------|----------|----------|
| **日常 (Son)** | 每天执行 | 14 天 | 删除 13 天前的文件 |
| **周备 (Father)** | 每周一 | 4 周（28 天） | 删除 27 天前的文件 |
| **月备 (Grandfather)** | 每月第一个周一 | 12 个月（365 天） | 删除 364 天前的文件 |

---

## 二、目录结构

```
/home/ubuntu/CRM/backups/
├── scripts/
│   ├── backup.sh          # 主备份脚本（备份 + 清理 + 触发校验）
│   └── verify.sh          # 校验脚本（临时容器恢复验证）
├── logs/
│   ├── backup.log         # 备份执行日志
│   └── verify.log         # 校验结果日志
├── daily/                 # 日常备份，保留 14 天
├── weekly/                # 周一备份，保留 4 周
└── monthly/               # 每月第一个周一备份，保留 12 个月
```

---

## 三、定时任务

### Crontab 配置

```cron
# CRM 系统 - 每日凌晨3点备份（含自动校验与分层保留）
0 3 * * * /home/ubuntu/CRM/backups/scripts/backup.sh >> /home/ubuntu/CRM/backups/logs/backup.log 2>&1
```

### 执行时间说明

- **每天凌晨 03:00** 执行备份
- 备份完成后 **自动触发校验**
- 校验通过或失败均记录到日志

---

## 四、备份文件命名规范

```
crm_backup_YYYYMMDD_HHMMSS.dump
crm_backup_YYYYMMDD_HHMMSS.dump.md5
```

**示例**：
- `crm_backup_20260506_030000.dump` — 日常备份
- `crm_backup_20260506_030000.dump.md5` — 对应的 MD5 校验文件

---

## 五、分层备份逻辑

每天凌晨 3 点执行备份时，按以下逻辑处理：

1. **所有日期**：生成备份到 `daily/` 目录
2. **周一**（`date +%u` == 1）：将备份**复制**到 `weekly/` 目录
3. **每月第一个周一**（周一且日期 ≤ 7）：将备份**复制**到 `monthly/` 目录
4. **清理**：各目录按独立周期删除过期文件

> 注意：周备和月备是日常备份的**独立副本**，互不干扰，确保各层保留策略正确执行。

---

## 六、自动校验机制

每次备份完成后，自动执行以下校验：

1. **MD5 校验**：验证备份文件完整性
2. **恢复验证**：启动临时 PostgreSQL 容器，执行 `pg_restore`
3. **数据完整性检查**：查询关键表行数确认恢复成功
   - `users`
   - `customers`
   - `leads`
   - `activities`
   - `opportunities`
   - `achievements`
4. **清理**：销毁临时容器

---

## 七、常用运维命令

### 查看备份文件

```bash
# 查看最新日常备份
ls -lt /home/ubuntu/CRM/backups/daily/ | head -5

# 查看所有周一备份
ls -lt /home/ubuntu/CRM/backups/weekly/ | head -5

# 查看所有月度备份
ls -lt /home/ubuntu/CRM/backups/monthly/ | head -5
```

### 查看日志

```bash
# 实时查看备份日志
tail -f /home/ubuntu/CRM/backups/logs/backup.log

# 查看校验日志
tail -f /home/ubuntu/CRM/backups/logs/verify.log

# 查看本次备份结果
grep "2026-05-06" /home/ubuntu/CRM/backups/logs/backup.log
```

### 手动触发备份

```bash
/home/ubuntu/CRM/backups/scripts/backup.sh
```

### 手动触发校验

```bash
/home/ubuntu/CRM/backups/scripts/verify.sh /home/ubuntu/CRM/backups/daily/crm_backup_20260506_030000.dump
```

---

## 八、数据库恢复操作

### 8.1 全量恢复（清空现有数据后恢复）

```bash
# 指定要恢复的备份文件
BACKUP_FILE="/home/ubuntu/CRM/backups/daily/crm_backup_20260506_030000.dump"

# 执行恢复（--clean 会先删除现有对象）
docker exec -i -e PGUSER=postgres crm-db-prod \
  pg_restore -d crm --clean --if-exists < "$BACKUP_FILE"
```

### 8.2 恢复特定表

```bash
BACKUP_FILE="/home/ubuntu/CRM/backups/daily/crm_backup_20260506_030000.dump"

# 仅恢复 customers 表
docker exec -i -e PGUSER=postgres crm-db-prod \
  pg_restore -d crm --clean --if-exists -t "customers" < "$BACKUP_FILE"
```

### 8.3 查看备份内容

```bash
BACKUP_FILE="/home/ubuntu/CRM/backups/daily/crm_backup_20260506_030000.dump"

# 列出备份中包含的所有对象
docker exec -i crm-db-prod pg_restore --list < "$BACKUP_FILE"
```

### 8.4 恢复到临时容器（验证用）

```bash
BACKUP_FILE="/home/ubuntu/CRM/backups/daily/crm_backup_20260506_030000.dump"

# 启动临时容器
docker run -d --name crm-verify-temp -e POSTGRES_PASSWORD=temp postgres:16-alpine
sleep 6

# 恢复备份
docker exec -i crm-verify-temp pg_restore -U postgres -d postgres --create < "$BACKUP_FILE"

# 进入临时容器查询
docker exec -it crm-verify-temp psql -U postgres -d crm -c "SELECT COUNT(*) FROM users;"

# 清理临时容器
docker rm -f crm-verify-temp
```

---

## 九、磁盘空间估算

| 项目 | 大小 |
|------|------|
| 单次备份 | ~2 MB（pg_dump 自定义格式 + 压缩） |
| daily（14 份） | ~28 MB |
| weekly（4 份） | ~8 MB |
| monthly（12 份） | ~24 MB |
| **年总占用峰值** | **~60 MB** |
| 当前磁盘余量 | 34 GB |

> 结论：备份对磁盘空间的影响可忽略不计。

---

## 十、扩展建议

### 10.1 增加异地备份（推荐下一步）

当前备份全部存储在本地磁盘，存在单点故障风险。建议增加异地备份：

- **方案 A**：使用 `rclone` 同步到云对象存储（阿里云 OSS / AWS S3）
- **方案 B**：使用 `rsync + ssh` 同步到另一台 VPS
- **方案 C**：挂载外部存储（NAS / USB）到 `/mnt/backup`

### 10.2 增加告警通知

在 `backup.sh` 校验失败分支中增加通知推送：

```bash
# 钉钉/企业微信 Webhook 示例
curl -X POST "https://oapi.dingtalk.com/robot/send?access_token=xxx" \
  -H "Content-Type: application/json" \
  -d '{"msgtype": "text", "text": {"content": "CRM 备份校验失败，请检查！"}}'
```

---

## 十一、备份保留策略推演示例

以 2026 年 5 月为例：

| 日期 | 星期 | 行为 |
|------|------|------|
| 5 月 6 日 | 周三 | 仅生成 daily 备份 |
| 5 月 12 日 | 周一 | daily + weekly（周备） |
| 5 月 19 日 | 周一 | daily + weekly |
| 5 月 26 日 | 周一 | daily + weekly |
| 6 月 2 日 | 周一 | daily + weekly + monthly（6 月第一个周一，月备） |
| 6 月 9 日 | 周一 | daily + weekly |
| 6 月 30 日 | 周二 | daily（5 月 12 日的周备被删除，已满 4 周） |

---

## 十二、相关文件清单

| 文件路径 | 说明 |
|----------|------|
| `/home/ubuntu/CRM/backups/scripts/backup.sh` | 主备份脚本 |
| `/home/ubuntu/CRM/backups/scripts/verify.sh` | 校验脚本 |
| `/home/ubuntu/CRM/backups/logs/backup.log` | 备份执行日志 |
| `/home/ubuntu/CRM/backups/logs/verify.log` | 校验结果日志 |
| `/home/ubuntu/CRM/backupdb.md` | 本文档 |
| `/home/ubuntu/CRM/docker-compose.yml` | Docker Compose 生产配置 |
| `/home/ubuntu/CRM/prisma/schema.prisma` | Prisma 数据库模型 |

---

## 十三、问题排查

### Q1：备份文件大小为 0 或异常小？

检查数据库容器是否正常运行：
```bash
docker ps --filter "name=crm-db-prod"
docker logs crm-db-prod --tail 20
```

### Q2：校验失败（pg_restore 报错）？

1. 查看详细校验日志：`cat /home/ubuntu/CRM/backups/logs/verify.log`
2. 检查临时容器是否成功启动：`docker ps -a | grep crm-verify`
3. 手动执行校验脚本排查问题

### Q3：磁盘空间不足？

```bash
# 查看备份目录总大小
du -sh /home/ubuntu/CRM/backups/

# 查看各层目录大小
du -sh /home/ubuntu/CRM/backups/*/
```

### Q4：备份未按时执行？

```bash
# 检查 crontab 是否正确配置
crontab -l | grep CRM

# 检查 cron 服务状态
systemctl status cron
```

---

*文档维护：当备份策略、脚本或目录结构发生变更时，请同步更新本文档。*
