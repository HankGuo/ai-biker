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

本项目现在默认采用“浏览器本地保存配置，后端无状态执行”的模式：

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

启动器会自动检查端口：

- 后端默认从 `3001` 开始找可用端口。
- 前端默认从 `5173` 开始找可用端口。
- 如果端口被占用，会自动改用下一个可用端口。
- 终端会打印实际前端地址，例如 `http://localhost:5173` 或 `http://localhost:5174`。

## 使用方式

1. 打开终端里显示的前端地址。
2. 在“嘉宾与主持”里添加至少 2 个模型。
3. 每个模型需要填写：
   - API 地址，例如 OpenAI-compatible `/v1/chat/completions` 地址
   - 模型名称
   - API Key
4. 选择一位模型作为“兼任主持人”。
5. 输入讨论主题，点击“开麦！”。

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
├── scripts/start.mjs     # 跨平台启动器，自动避开端口冲突
├── config.json           # 仅默认话题/轮次，无敏感信息
├── start.sh              # macOS/Linux 一键启动
├── start.bat             # Windows 一键启动
└── package.json
```

## 开发命令

```bash
npm run dev
npm run build
cd backend && npm run build
```

## 许可证

MIT
