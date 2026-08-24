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

推荐使用 Docker 运行应用，并由宿主机 Nginx 提供域名和 HTTPS：

```bash
docker compose up -d --build
```

完整的服务器准备、Nginx、HTTPS、更新和停止步骤见 [`docs/DEPLOYMENT.md`](docs/DEPLOYMENT.md)。生产构建会生成 `dist/standalone/server.js`，容器只将应用绑定到服务器本机的 `127.0.0.1:3000`，应由 Nginx 转发，而不是直接开放该端口。

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
docs/              部署和运维文档
```

## 数据存储

当前版本不需要数据库，棋局数据使用浏览器 `localStorage` 保存。后续接入在线排行榜时，应由服务端 API 校验并写入成绩，前端不应直接访问数据库。
