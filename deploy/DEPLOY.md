# LAS v5.2.3 部署指南

## 前置条件

- 服务器: Ubuntu 22.04+ / Debian 12+，2 核 2G+
- 域名已备案（中国大陆），DNS 已解析
- 已安装: Docker 24+、docker compose v2
- SSL 证书（推荐腾讯云免费证书或 Let's Encrypt）

## 部署步骤

### 1. 服务器初始化

```bash
# 安装 Docker
curl -fsSL https://get.docker.com | bash
sudo usermod -aG docker $USER
newgrp docker

# 安装 nginx
sudo apt update && sudo apt install -y nginx sqlite3 certbot

# 创建目录
sudo mkdir -p /opt/las /opt/las/data /opt/las/backups
sudo chown -R $USER:$USER /opt/las
```

### 2. 拉取代码

```bash
cd /opt/las
git clone https://github.com/your-org/las.git .
git checkout feat/v5.2.3-stable
```

### 3. 配置文件

```bash
# 复制环境变量
cp .env.example .env
# 编辑 .env，修改:
#   LAS_LLM_API_KEY=你的真实Key
#   LAS_SECRET_KEY=$(python -c "import secrets; print(secrets.token_urlsafe(32))")
#   LAS_CORS_ORIGINS=https://你的域名
#   LAS_DEV=false

# 修改 nginx 配置中的域名
sed -i 's/your-domain.com/你的实际域名/g' deploy/nginx.conf
```

### 4. 启动服务

```bash
# 构建并启动
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d --build

# 验证
curl http://localhost:8000/api/health
```

### 5. 配置 nginx

```bash
sudo cp deploy/nginx.conf /etc/nginx/sites-available/las
sudo ln -s /etc/nginx/sites-available/las /etc/nginx/sites-enabled/las
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t && sudo systemctl reload nginx
```

### 6. SSL 证书（腾讯云免费 SSL）

```bash
# 下载证书文件（.crt + .key），上传到服务器
sudo mkdir -p /etc/nginx/ssl
sudo mv fullchain.crt /etc/nginx/ssl/fullchain.pem
sudo mv private.key /etc/nginx/ssl/privkey.pem
sudo chmod 600 /etc/nginx/ssl/privkey.pem

# 取消 nginx.conf 中 SSL 部分的注释
# 将 listen 80 改为 listen 443 ssl http2
# 取消 ssl_certificate 相关行的注释

sudo nginx -t && sudo systemctl reload nginx
```

### 7. 设置开机自启 + 自动备份

```bash
# systemd 服务
sudo cp deploy/las.service /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable las

# 每日凌晨 3 点备份数据库
(crontab -l 2>/dev/null; echo "0 3 * * * bash /opt/las/deploy/backup.sh >> /opt/las/data/backup.log 2>&1") | crontab -
```

### 8. 备案号挂载

备案通过后，在 `frontend/spa.html` 页脚添加:
```html
<a href="https://beian.miit.gov.cn/" target="_blank" rel="noopener">粤ICP备xxxxxxxx号</a>
```

## 日常运维

| 操作 | 命令 |
|------|------|
| 查看日志 | `docker compose logs -f --tail=100` |
| 重启服务 | `docker compose -f docker-compose.yml -f docker-compose.prod.yml restart` |
| 更新代码 | `git pull && docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d --build` |
| 手动备份 | `bash deploy/backup.sh` |
| 恢复备份 | `zcat backups/las_20250101_030000.db.gz > data/las.db && docker compose restart` |
| 健康检查 | `curl https://你的域名/api/health` |

## 故障排查

1. **502 Bad Gateway**: Docker 容器未运行 → `docker compose ps`
2. **报告 404**: 检查 LLM API Key 是否有效 → `docker compose logs las | grep ERROR`
3. **CORS 错误**: 检查 `.env` 中 `LAS_CORS_ORIGINS` 是否匹配实际域名
4. **分析超时**: nginx `proxy_read_timeout` 需 ≥ 600s，`proxy_buffering off`
5. **数据库锁**: SQLite WAL 模式已启用，多个分析同时进行时可能阻塞，排队等待

## 迁移到 PostgreSQL（可选，用户量 > 100 时考虑）

当前 SQLite 在单服务器场景下足够。如需要高并发写入，迁移步骤:
1. 安装 `psycopg2-binary`
2. 修改 `LAS_DB_PATH` 为 PostgreSQL 连接字符串
3. 用 Alembic 管理 schema 变更
4. 迁移数据: `sqlite3 data/las.db .dump | psql las`
