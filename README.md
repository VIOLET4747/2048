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

生产构建会生成 `dist/standalone/server.js`。在公网服务器安装 Git 和 Docker 后运行：

```bash
git clone https://github.com/VIOLET4747/2048.git
cd 2048
docker compose up -d --build
docker compose ps
```

默认会在服务器所有网卡上开放 `3000` 端口。在云服务器安全组和系统防火墙中放行 TCP 3000 后，直接访问：

```text
http://服务器公网IP:3000/
```

检查服务器本机是否启动成功：

```bash
curl -I http://127.0.0.1:3000/
```

当前方案使用 HTTP，不需要域名、Nginx 或 HTTPS 证书，适合个人试用。不要开放除 SSH 和 3000 以外的不必要端口。

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
```

## 数据存储

当前版本不需要数据库，棋局数据使用浏览器 `localStorage` 保存。后续接入在线排行榜时，应由服务端 API 校验并写入成绩，前端不应直接访问数据库。
