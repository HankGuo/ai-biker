import type { Model, Stance, Message, DiscussionConfig } from './types.js';

// 关键词匹配确定立场类型
function getStanceType(stance: string): 'positive' | 'negative' | 'neutral' {
  const lower = stance.toLowerCase();
  const positive = ['支持', '赞成', '乐观', '看好', '积极', '推动', '发展', '赞成', '必然', '肯定'];
  const negative = ['反对', '悲观', '质疑', '担忧', '保守', '抵制', '拒绝', '不可能', '绝不'];

  for (const kw of positive) {
    if (lower.includes(kw)) return 'positive';
  }
  for (const kw of negative) {
    if (lower.includes(kw)) return 'negative';
  }
  return 'neutral';
}

export async function generateStances(
  models: Model[],
  topic: string,
  referee?: Model
): Promise<Stance[]> {
  const prompt = `你是一场辩论的兼任主持人：既要控场，也要亲自下场输出观点。请根据以下讨论主题，为${models.length}个选手生成截然不同、有明显分歧的立场观点。

主题：${topic}

要求：
1. 每个立场用2-6个字概括
2. 立场之间必须有明显分歧和对抗性
3. 涵盖正反和中间立场
4. 直接返回JSON数组，不要解释

返回格式：["立场一", "立场二", "立场三"]`;

  const selected = referee || models[Math.floor(Math.random() * models.length)];
  let stances: string[] = [];

  try {
    const res = await fetch(selected.apiUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${selected.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: selected.modelName,
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.8,
        max_tokens: 200,
      }),
    });

    if (!res.ok) throw new Error(`API错误: ${res.status}`);

    const data = await res.json();
    const content = data.choices?.[0]?.message?.content || '';

    // 尝试解析 JSON
    try {
      const match = content.match(/\[[\s\S]*?\]/);
      if (match) {
        const parsed = JSON.parse(match[0]);
        if (Array.isArray(parsed)) stances = parsed;
      }
    } catch {
      // JSON 解析失败，用兜底方案
    }
  } catch (e) {
    console.error('生成立场失败:', e);
  }

  // 兜底立场
  if (stances.length < models.length) {
    const defaults = ['大力支持', '坚决反对', '谨慎观望', '理性分析', '折中方案'];
    for (let i = stances.length; i < models.length; i++) {
      stances.push(defaults[i % defaults.length]);
    }
  }

  // 主持人分配：如果主持人参与了，主持人的立场由自己指定（取第一个），其余随机
  if (referee) {
    const otherModels = models.filter(m => m.id !== referee.id);
    const otherStances = stances.slice(1, 1 + otherModels.length);
    const refereeStance = stances[0];
    const result: Stance[] = [];

    result.push({
      modelId: referee.id,
      modelName: referee.modelName,
      stance: refereeStance,
      type: getStanceType(refereeStance),
    });

    otherModels.forEach((m, i) => {
      const s = otherStances[i] || '中立';
      result.push({
        modelId: m.id,
        modelName: m.modelName,
        stance: s,
        type: getStanceType(s),
      });
    });

    return result;
  }

  // 无主持人时随机分配
  const shuffled = [...stances].sort(() => Math.random() - 0.5);

  return models.map((model, i) => ({
    modelId: model.id,
    modelName: model.modelName,
    stance: shuffled[i] || '中立',
    type: getStanceType(shuffled[i] || '中立'),
  }));
}

export async function* generateDiscussion(
  models: Model[],
  stances: Stance[],
  config: DiscussionConfig,
  referee?: Model
): AsyncGenerator<{ type: string; data: unknown }> {
  const { topic, rounds } = config;

  // 由主持人分配发言顺序；无主持人时随机
  let orderedModels: Model[];
  if (referee) {
    const others = models.filter(m => m.id !== referee.id).sort(() => Math.random() - 0.5);
    orderedModels = [...others, referee];
  } else {
    orderedModels = [...models].sort(() => Math.random() - 0.5);
  }

  const orderedStances = orderedModels.map(m => stances.find(s => s.modelId === m.id)!);

  // 维护讨论历史，供后续模型参考
  const history: Message[] = [];

  for (let round = 1; round <= rounds; round++) {
    yield { type: 'round_start', data: { round } };

    for (let i = 0; i < orderedModels.length; i++) {
      const model = orderedModels[i];
      const stance = orderedStances[i];
      const messageId = `msg-${round}-${i}-${Date.now()}`;

      // 构造带历史上下文的提示词
      const historyText = history.length > 0
        ? history.map(m => `${m.modelName}：${m.content}`).join('\n')
        : '';

      const prompt = `你正在参与一场关于"${topic}"的讨论。
你的立场是：【${stance.stance}】
这是第 ${round} 轮讨论（共 ${rounds} 轮）。
${historyText ? `\n之前的讨论记录：\n${historyText}\n` : ''}
要求：
1. 紧扣你的立场发言
2. 可以引用或回应之前的观点
3. 论述要有理有据
4. 控制在150字以内
5. 语气可以有适当的对抗性`;

      yield {
        type: 'message_start',
        data: {
          id: messageId,
          modelId: model.id,
          modelName: model.modelName,
          stance: stance.stance,
          stanceType: stance.type,
          round,
          timestamp: Date.now(),
        },
      };

      let fullContent = '';

      try {
        const res = await fetch(model.apiUrl, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${model.apiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: model.modelName,
            messages: [{ role: 'user', content: prompt }],
            temperature: 0.8,
            max_tokens: 500,
            stream: false,
          }),
        });

        if (!res.ok) {
          const errChunk = `[API调用失败: ${res.status}]`;
          yield { type: 'message_chunk', data: { messageId, chunk: errChunk } };
          fullContent = errChunk;
        } else {
          const data = await res.json();
          const content = data.choices?.[0]?.message?.content || '';
          fullContent = content;

          // 流式输出效果
          const chars = content.split('');
          for (let j = 0; j < chars.length; j += 3) {
            const chunk = chars.slice(j, j + 3).join('');
            yield { type: 'message_chunk', data: { messageId, chunk } };
            await sleep(10);
          }
        }
      } catch (e) {
        const errorMsg = e instanceof Error ? e.message : String(e);
        const errChunk = `[错误: ${errorMsg}]`;
        yield { type: 'message_chunk', data: { messageId, chunk: errChunk } };
        fullContent = errChunk;
      }

      yield { type: 'message_end', data: { messageId } };

      // 将当前发言加入历史
      history.push({
        id: messageId,
        modelId: model.id,
        modelName: model.modelName,
        stance: stance.stance,
        stanceType: stance.type,
        content: fullContent,
        round,
        timestamp: Date.now(),
      });
    }
  }

  yield { type: 'complete', data: {} };
}

export async function generateSummary(
  referee: Model,
  topic: string,
  stances: Stance[],
  messages: Message[]
): Promise<string> {
  const transcript = messages.map(m =>
    `【${m.modelName} | ${m.stance} | 第${m.round}轮】\n${m.content}`
  ).join('\n\n');

  const prompt = `你是一场辩论的兼任主持人。请根据以下辩论记录，生成一份幽默、犀利、有网感的辩论总结简报。语气要像深夜电台主持人，带点吐槽和玩梗。

主题：${topic}

各选手立场：
${stances.map(s => `- ${s.modelName}：${s.stance}`).join('\n')}

辩论记录：
${transcript}

要求：
1. 用3-5个段落总结整场辩论的交锋焦点和各自表现
2. 给出一个"最佳输出"或"MVP"评价
3. 语气轻松、搞笑、有梗，适合社交媒体分享
4. 总字数控制在300字以内`;

  try {
    const res = await fetch(referee.apiUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${referee.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: referee.modelName,
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.9,
        max_tokens: 800,
        stream: false,
      }),
    });

    if (!res.ok) throw new Error(`API错误: ${res.status}`);

    const data = await res.json();
    return data.choices?.[0]?.message?.content || '总结生成失败，这场火药味太浓，主持人把提词卡都捏皱了。';
  } catch (e) {
    console.error('生成总结失败:', e);
    return '总结生成失败，这场火药味太浓，主持人把提词卡都捏皱了。';
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}
