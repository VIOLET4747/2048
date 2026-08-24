# 公网服务器部署

推荐架构：Docker 运行游戏服务，宿主机 Nginx 负责公网入口和 HTTPS。

```text
浏览器 → Nginx :80/:443 → 127.0.0.1:3000 → 2048 Docker 容器
```

应用端口只绑定到 `127.0.0.1`，不会直接暴露在公网。Nginx 负责域名、访问日志、缓存响应头和 TLS 证书。

## 服务器要求

- 1 核 CPU、512 MB 内存即可运行
- 推荐 Debian 12 或 Ubuntu 24.04 LTS
- 已安装 Git、Docker Engine、Docker Compose 插件和 Nginx
- 域名的 A/AAAA 记录已经指向服务器公网 IP
- 防火墙开放 TCP 80 和 443，不开放 3000

## 首次部署

```bash
git clone https://github.com/VIOLET4747/2048.git
cd 2048
docker compose up -d --build
docker compose ps
curl -I http://127.0.0.1:3000/
```

将 Nginx 示例复制到系统配置目录，并把示例域名替换成自己的域名：

```bash
sudo cp deploy/nginx.conf.example /etc/nginx/sites-available/2048
sudo nano /etc/nginx/sites-available/2048
sudo ln -s /etc/nginx/sites-available/2048 /etc/nginx/sites-enabled/2048
sudo nginx -t
sudo systemctl reload nginx
```

确认 HTTP 能访问后，用 Certbot 为 Nginx 配置 HTTPS：

```bash
sudo certbot --nginx -d 2048.example.com
```

将命令中的 `2048.example.com` 换成真实域名。

## 更新版本

```bash
cd 2048
git pull --ff-only
docker compose up -d --build
docker image prune -f
```

## 查看状态和日志

```bash
docker compose ps
docker compose logs -f --tail=100
curl -I http://127.0.0.1:3000/
sudo nginx -t
```

## 停止和恢复

```bash
docker compose stop
docker compose start
```

彻底移除容器但保留源码：

```bash
docker compose down
```

## 无域名临时测试

可以先把 `deploy/nginx.conf.example` 中的 `server_name` 改为 `_`，通过服务器 IP 访问。正式对外使用时建议配置域名和 HTTPS。
