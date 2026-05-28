# 爱扯皮

一个本地运行的多模型讨论系统：你在浏览器里配置多个 OpenAI-compatible Chat Completions 模型，选一位模型兼任主持人，然后让它们围绕同一个话题轮流发言、互相回应，最后由主持人生成一份战报。

## 它是干嘛的

- 多个模型围绕同一主题进行讨论。
- 每个模型会先被分配一个明确立场。
- 后续发言会看到之前的讨论记录，所以不是各说各话。
- 前端通过 SSE 接收后端流式事件，展示立场、发言、等待动效和总结。

## 技术栈

- 前端：React 18 + TypeScript + Vite + Tailwind CSS + Framer Motion
- 后端：Express.js + TypeScript
- 通信：REST API + SSE

## 安全与数据存储

本项目默认采用"浏览器本地保存配置，后端无状态执行"的模式：

- 项目不内置任何模型地址、模型名称或 API Key。
- 模型配置只保存在你自己浏览器的 `localStorage` 中，key 为 `ai-bicker.models.v1`。
- 后端不保存模型配置，不写数据库，不写配置文件，也不维护服务器端模型列表。
- 开始讨论时，浏览器会把本次需要使用的模型配置临时发送给本机后端；后端只在当前请求内使用这些信息调用模型服务，请求结束后即释放。
- 后端健康检查会返回 `storage: "stateless"`，用于确认后端没有模型存储状态。
- 请不要把这个后端部署到不可信机器上使用你的 API Key；如果你把服务开放到公网或局域网，后端进程在请求期间仍然会接触到本次请求里的 API Key。

如果你曾经使用过旧版本，建议在浏览器开发者工具里清理旧的 `localStorage` 模型配置，再重新添加。

## 快速开始

前提：Node.js >= 18。

### macOS / Linux

```bash
chmod +x start.sh
./start.sh
```

### Windows

双击 `start.bat`，或在项目目录运行：

```bat
start.bat
```

### 通用方式

```bash
npm install
npm run start
```

### 停止服务

#### macOS / Linux

```bash
chmod +x stop.sh
./stop.sh
```

#### Windows

双击 `stop.bat`，或在项目目录运行：

```bat
stop.bat
```

#### 通用方式

```bash
npm run stop
```

## 端口说明

- **前端固定端口：`26528`**
- **后端固定端口：`26529`**

启动器不会自动跳端口。如果任一端口被占用，启动时会打印友好提示并退出，例如：

```
错误: 前端端口 26528 已被占用。
请关闭占用该端口的进程，或设置环境变量 FRONTEND_PORT 指定其他端口。
示例: FRONTEND_PORT=26538 npm run start
```

如需临时指定其他端口，可设置环境变量：

```bash
FRONTEND_PORT=26538 BACKEND_PORT=26539 npm run start
```

## 使用方式

1. 打开终端里显示的前端地址（默认 `http://localhost:26528`）。
2. 在"嘉宾与主持"里添加至少 2 个模型。
3. 每个模型需要填写：
   - API 地址，例如 OpenAI-compatible `/v1/chat/completions` 地址
   - 模型名称
   - API Key
4. 选择一位模型作为"兼任主持人"。
5. 输入讨论主题，点击"开麦！"。

## 配置文件

`config.json` 只保存非敏感默认项：

```json
{
  "default_topic": "人工智能会取代人类工作吗？",
  "default_rounds": 3
}
```

不要把 API Key 写进 `config.json`，也不要提交任何含密钥的文件。

## 项目结构

```text
ai-biker/
├── backend/              # Express.js 后端，无模型持久化状态
│   ├── src/
│   │   ├── server.ts     # API + SSE 路由
│   │   ├── config.ts     # 默认非敏感配置
│   │   ├── discussion.ts # 讨论逻辑
│   │   └── types.ts
│   └── package.json
├── frontend/             # React 前端，本地 localStorage 保存模型配置
│   ├── src/
│   │   ├── App.tsx
│   │   ├── components/
│   │   ├── context/
│   │   └── types.ts
│   └── package.json
├── scripts/
│   ├── start.mjs         # 跨平台启动器
│   └── stop.mjs          # 跨平台停止器
├── config.json           # 仅默认话题/轮次，无敏感信息
├── start.sh              # macOS/Linux 一键启动
├── start.bat             # Windows 一键启动
├── stop.sh               # macOS/Linux 一键停止
├── stop.bat              # Windows 一键停止
└── package.json
```

## 开发命令

```bash
npm run dev          # 开发模式启动前后端
npm run start        # 生产模式启动前后端
npm run stop         # 停止前后端服务
npm run build        # 构建前端
```

单独启动/停止：

```bash
cd backend && npm run dev    # 单独启动后端开发模式
cd frontend && npm run dev   # 单独启动前端开发模式
```

## 许可证

MIT
