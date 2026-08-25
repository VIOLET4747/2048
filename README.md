# MERGE / 2048

一个本地优先、支持键盘与触屏操作的 2048 网页小游戏。

## 功能

- 标准 2048 移动、合并、计分与胜负规则
- 方块在格子之间连续滑动，合并和生成拥有独立反馈
- 标准、慢速、极慢三档动画速度
- 方向键、WASD 与移动端滑动操作
- 当前棋局、最高分与动画速度保存在浏览器中
- 单步撤销、重新开始与达成 2048 后继续挑战
- 桌面端和移动端自适应布局

## 本地运行

需要 Node.js 22.13 或更高版本。

```powershell
npm install
npm run dev
```

打开 `http://localhost:3000/`。

## 验证

```powershell
npm test
npm run lint
```

`npm test` 会先完成生产构建，再验证首页能正确渲染游戏内容。

## 公网部署

生产构建会生成 `dist/standalone/server.js`。推荐使用 Docker 运行应用，并由宿主机 Nginx 提供域名和 HTTPS：

```bash
git clone https://github.com/VIOLET4747/2048.git
cd 2048
docker compose up -d --build
docker compose ps
curl -I http://127.0.0.1:3000/
```

默认配置为：

```text
浏览器 → Nginx :80/:443 → 127.0.0.1:3000 → 2048 Docker 容器
```

应用端口只绑定到服务器本机，公网不能直接访问 `服务器IP:3000`。服务器防火墙只需开放 TCP 80 和 443。

### 临时直接开放 3000 端口

如果只是测试，可以让 Compose 把 3000 端口监听在所有网卡：

```bash
APP_BIND_ADDRESS=0.0.0.0 docker compose up -d --build
```

然后在云服务器安全组和系统防火墙中开放 TCP 3000，即可访问：

```text
http://服务器公网IP:3000/
```

这种方式没有 HTTPS，不建议作为正式长期部署。恢复为仅本机监听：

```bash
docker compose down
docker compose up -d
```

### 配置 Nginx

需要先让域名的 A/AAAA 记录指向服务器公网 IP。复制配置模板并替换其中的 `2048.example.com`：

```bash
sudo cp deploy/nginx.conf.example /etc/nginx/sites-available/2048
sudo nano /etc/nginx/sites-available/2048
sudo ln -s /etc/nginx/sites-available/2048 /etc/nginx/sites-enabled/2048
sudo nginx -t
sudo systemctl reload nginx
```

确认 HTTP 能访问后，使用 Certbot 配置 HTTPS：

```bash
sudo certbot --nginx -d 2048.example.com
```

将命令中的域名换成自己的真实域名。

### 更新、日志与停止

更新版本：

```bash
git pull --ff-only
docker compose up -d --build
docker image prune -f
```

查看状态和日志：

```bash
docker compose ps
docker compose logs -f --tail=100
```

停止、恢复和移除容器：

```bash
docker compose stop
docker compose start
docker compose down
```

## 项目结构

```text
app/page.tsx       游戏规则、状态、存档与交互
app/globals.css    页面布局、棋盘样式和动画
app/layout.tsx     页面元数据与根布局
worker/index.ts    Cloudflare/Vinext 运行入口
tests/             构建后的页面冒烟测试
Dockerfile         生产镜像
compose.yaml       容器启动与健康检查
deploy/            Nginx 示例配置
```

## 数据存储

当前版本不需要数据库，棋局数据使用浏览器 `localStorage` 保存。后续接入在线排行榜时，应由服务端 API 校验并写入成绩，前端不应直接访问数据库。
