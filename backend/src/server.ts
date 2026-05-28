import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { getDefaultConfig } from './config.js';
import { generateStances, generateDiscussion, generateSummary } from './discussion.js';
import type { DiscussionConfig, Model } from './types.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const app = express();
const DEFAULT_PORT = 26529;
const PORT = readPort(process.env.PORT || process.env.BACKEND_PORT, DEFAULT_PORT);

interface DiscussionStartRequest extends DiscussionConfig {
  models?: unknown;
  refereeId?: string;
}

function readPort(value: string | undefined, fallback: number): number {
  if (!value) return fallback;
  const port = Number(value);
  return Number.isInteger(port) && port > 0 && port < 65536 ? port : fallback;
}

function normalizeModels(input: unknown): Model[] {
  if (!Array.isArray(input)) {
    throw new Error('请先在浏览器本地添加模型配置');
  }

  if (input.length < 2) {
    throw new Error('至少需要2个模型');
  }

  if (input.length > 5) {
    throw new Error('最多支持5个模型');
  }

  return input.map((item, index) => {
    if (!item || typeof item !== 'object') {
      throw new Error(`第 ${index + 1} 个模型配置无效`);
    }

    const source = item as Record<string, unknown>;
    const id = typeof source.id === 'string' && source.id.trim()
      ? source.id.trim()
      : `model-${index + 1}`;
    const apiUrl = typeof source.apiUrl === 'string' ? source.apiUrl.trim() : '';
    const apiKey = typeof source.apiKey === 'string' ? source.apiKey.trim() : '';
    const modelName = typeof source.modelName === 'string' ? source.modelName.trim() : '';
    const isReferee = source.isReferee === true;

    if (!apiUrl || !apiKey || !modelName) {
      throw new Error(`第 ${index + 1} 个模型缺少 API 地址、API Key 或模型名称`);
    }

    return { id, apiUrl, apiKey, modelName, isReferee };
  });
}

app.use(cors());
app.use(express.json({ limit: '1mb' }));

// 静态文件（生产环境用）
app.use(express.static(path.resolve(__dirname, '../../frontend/dist')));

// 获取默认配置。模型配置不在后端保存。
app.get('/api/config', (_req, res) => {
  res.json(getDefaultConfig());
});

// 开始讨论（SSE 流式输出）。模型配置只随本次请求临时使用，不写入文件或内存全局状态。
app.post('/api/discussion/start', async (req, res) => {
  let models: Model[];
  let topic: string;
  let rounds: number;
  let referee: Model | undefined;

  try {
    const body = req.body as DiscussionStartRequest;
    models = normalizeModels(body.models);
    topic = typeof body.topic === 'string' ? body.topic.trim() : '';
    rounds = Number.isInteger(body.rounds) ? body.rounds : Number(body.rounds || 3);

    if (!topic) {
      return res.status(400).json({ error: '请输入讨论主题' });
    }

    if (!Number.isInteger(rounds) || rounds < 1 || rounds > 10) {
      return res.status(400).json({ error: '讨论轮次必须在 1 到 10 之间' });
    }

    referee = body.refereeId
      ? models.find(m => m.id === body.refereeId)
      : models.find(m => m.isReferee);

    if (!referee) {
      return res.status(400).json({ error: '请选择兼任主持人' });
    }
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return res.status(400).json({ error: msg });
  }

  // 设置 SSE 头
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');

  try {
    // 第一步：生成立场
    res.write(`data: ${JSON.stringify({ type: 'status', status: 'generating_stances' })}\n\n`);
    const stances = await generateStances(models, topic, referee);
    res.write(`data: ${JSON.stringify({ type: 'stances', stances })}\n\n`);

    // 第二步：开始讨论
    res.write(`data: ${JSON.stringify({ type: 'status', status: 'discussing' })}\n\n`);

    const allMessages: import('./types.js').Message[] = [];

    const generator = generateDiscussion(models, stances, { topic, rounds }, referee);
    for await (const event of generator) {
      res.write(`data: ${JSON.stringify(event)}\n\n`);

      // 收集完整消息用于本次请求结束前生成总结。请求结束后变量随函数释放。
      if (event.type === 'message_start') {
        const msg = event.data as import('./types.js').Message;
        allMessages.push({ ...msg, content: '' });
      } else if (event.type === 'message_chunk') {
        const { messageId, chunk } = event.data as { messageId: string; chunk: string };
        const found = allMessages.find(m => m.id === messageId);
        if (found) found.content += chunk;
      }
    }

    // 第三步：主持人生成总结
    res.write(`data: ${JSON.stringify({ type: 'status', status: 'summarizing' })}\n\n`);
    const summary = await generateSummary(referee, topic, stances, allMessages);
    res.write(`data: ${JSON.stringify({ type: 'summary', summary })}\n\n`);

    res.write(`data: ${JSON.stringify({ type: 'status', status: 'completed' })}\n\n`);
    res.end();
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    res.write(`data: ${JSON.stringify({ type: 'error', error: msg })}\n\n`);
    res.end();
  }
});

// 健康检查。后端不保存模型配置。
app.get('/api/health', (_req, res) => {
  res.json({
    status: 'ok',
    port: PORT,
    storage: 'stateless',
    configuredModels: 0,
  });
});

// 未定义的 API 明确返回 JSON 404，避免落到前端 HTML。
app.use('/api', (_req, res) => {
  res.status(404).json({ error: 'API 不存在' });
});

// 生产环境：返回前端页面
app.get('*', (_req, res) => {
  res.sendFile(path.resolve(__dirname, '../../frontend/dist/index.html'));
});

app.listen(PORT, () => {
  console.log(`后端服务已启动: http://localhost:${PORT}`);
});
