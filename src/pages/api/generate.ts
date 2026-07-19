import type { APIRoute } from 'astro';

export const prerender = false;

interface PlatformPrompt {
  system: string;
  format: string;
}

const PLATFORM_PROMPTS: Record<string, PlatformPrompt> = {
  xiaohongshu: {
    system: '你是一位专业的小红书种草文案写手。风格真实、亲切、有感染力，像朋友分享好物。',
    format: '输出格式：\n1. 标题（20字以内，吸引眼球）\n2. 正文（200-400字，分段，适当使用emoji）\n3. 话题标签（5-8个，#开头）\n\n要求：开头要有钩子吸引停留，中间突出使用场景和效果，结尾引导互动。'
  },
  zhihu: {
    system: '你是一位知乎内容创作者。风格专业、有深度、有理有据，用事实和逻辑说服读者。',
    format: '输出格式：\n1. 标题（25字以内，引发好奇）\n2. 正文（500-800字，结构化论述）\n3. 总结建议\n\n要求：开头抛出核心观点或问题，中间用案例/数据支撑，结尾给出明确建议。语气专业但不枯燥。'
  },
  wechat: {
    system: '你是一位微信公众号内容编辑。风格通俗易懂、有温度、适合转发传播。',
    format: '输出格式：\n1. 标题（22字以内，吸引点击）\n2. 摘要（50字以内）\n3. 正文（600-1000字，分段清晰，有小标题）\n\n要求：结构清晰，每段不超过4行。善用故事、对比、数据增强说服力。结尾引导关注或转发。'
  },
  douyin: {
    system: '你是一位抖音短视频脚本策划。风格生动、节奏快、视觉感强，能在3秒内抓住注意力。',
    format: '输出格式：\n1. 视频标题（15字以内）\n2. 分镜脚本（3-5个场景，每个包含：画面描述 + 旁白/字幕 + 时长）\n3. 推荐BGM风格\n4. 话题标签（3-5个）\n\n要求：开头3秒必须有强钩子，整体节奏紧凑，结尾引导关注或评论。总时长控制在30-60秒。'
  },
  bilibili: {
    system: '你是一位B站UP主内容策划。风格有趣、有梗、接地气，能和观众产生共鸣。',
    format: '输出格式：\n1. 视频标题（25字以内，可用【】标注分类）\n2. 视频简介（100字以内）\n3. 内容大纲（3-5个段落，每段说明讲什么）\n4. 弹幕互动引导（2-3个）\n5. 标签（5个以内）\n\n要求：标题要有梗或引发好奇，内容要有干货也有趣味，适当埋梗。'
  },
  weibo: {
    system: '你是一位微博运营达人。风格简洁有力、话题性强，善于制造讨论。',
    format: '输出格式：\n1. 正文（140字以内，精炼有力）\n2. 话题标签（3-5个，#话题#格式）\n3. 配图建议（1-2张）\n\n要求：开头抓眼球，信息密度高，有观点或情绪价值，结尾引导转发或评论。'
  },
  qywechat: {
    system: '你是一位企业微信运营专家。风格专业可信、简洁高效，适合B端客户沟通。',
    format: '输出格式：\n1. 推送标题（20字以内）\n2. 正文（300-500字，结构清晰）\n3. CTA（明确的行动引导）\n\n要求：突出产品价值和专业性，用数据说话，语气专业但亲和。适合企业内部或客户群发。'
  },
  toutiao: {
    system: '你是一位头条号内容创作者。风格通俗易懂、信息量大，善于抓住热点和用户兴趣。',
    format: '输出格式：\n1. 标题（30字以内，三段式最佳）\n2. 封面描述建议\n3. 正文（800-1200字，段落短小）\n\n要求：标题信息量大、有悬念或数字，内容信息密度高，段落不超过3行。'
  },
  jike: {
    system: '你是一位即刻社区活跃用户。风格轻松随性、有态度、有品味，像朋友间闲聊。',
    format: '输出格式：\n1. 正文（100-200字，自然随性）\n2. 话题标签（2-3个）\n\n要求：语气随意不做作，有个人态度和品味，像在朋友圈分享。'
  }
};

const IMAGE_PROMPT_SYSTEM = `你是一位AI配图提示词专家。根据产品特点和推广内容，生成适合AI绘画工具（如Midjourney、DALL-E、Stable Diffusion、Flux等）的英文提示词。
输出格式：
1. 主图提示词（英文，50-80词，详细描述画面内容、风格、色调、构图）
2. 配图建议（中文，说明这张图适合用在什么位置）
要求：风格清新现代，适合社交媒体传播。避免文字、水印、logo。`;

const VIDEO_SCRIPT_SYSTEM = `你是一位短视频脚本策划专家。根据产品信息生成适合AI视频生成工具（如豆包AI）和剪映后期制作的详细分镜脚本。
输出格式：
1. 视频主题（一句话概括）
2. 分镜列表（3-5个分镜），每个分镜包含：
   - 【画面提示词】详细的视觉描述，可直接作为豆包AI视频生成的输入提示词（中文描述，包含主体、场景、光影、色调、运镜方式）
   - 【时长】建议时长（秒）
   - 【旁白/字幕】配文或旁白文案
   - 【运镜】镜头运动建议（如推、拉、摇、移、跟、环绕等）
   - 【音效/BGM】音效或背景音乐建议
3. 豆包AI生成参数建议（画面比例、时长、风格关键词）
4. 剪映制作建议（转场效果、字幕样式、配乐节奏点等）

要求：画面提示词要具体生动、画面感强，可以直接复制到豆包AI视频生成功能中使用。包含场景、光线、色彩、构图、镜头运动等关键信息。`;

export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.json();
    const { type, product, platforms, extra } = body;

    const apiKey = import.meta.env.ARK_API_KEY;
    const modelId = import.meta.env.ARK_MODEL_ID;

    if (!apiKey || !modelId) {
      return new JSONResponse({ error: 'API 配置缺失' }, { status: 500 });
    }

    async function callDoubao(systemPrompt: string, userPrompt: string): Promise<string> {
      const res = await fetch(`https://ark.cn-beijing.volces.com/api/v3/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: modelId,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt }
          ],
          temperature: 0.8,
          max_tokens: 2000,
        }),
      });
      const data = await res.json();
      if (data.choices && data.choices[0]) {
        return data.choices[0].message.content;
      }
      throw new Error(data.error?.message || 'API 调用失败');
    }

    const results: Record<string, any> = {};

    if (type === 'copy' || type === 'batch') {
      const selectedPlatforms = platforms || ['xiaohongshu'];
      const userPrompt = `产品信息：${product}\n${extra ? `额外要求：${extra}` : ''}`;

      const copyPromises = selectedPlatforms.map(async (p: string) => {
        const promptConfig = PLATFORM_PROMPTS[p];
        if (!promptConfig) return { platform: p, content: '不支持的平台' };
        try {
          const content = await callDoubao(
            promptConfig.system + '\n\n' + promptConfig.format,
            userPrompt
          );
          return { platform: p, content };
        } catch (e: any) {
          return { platform: p, content: `生成失败: ${e.message}` };
        }
      });

      const copyResults = await Promise.all(copyPromises);
      results.copy = copyResults;
    }

    if (type === 'image') {
      const userPrompt = `产品/主题：${product}\n风格偏好：${extra || '现代清新，适合社交媒体'}`;
      try {
        results.image = await callDoubao(IMAGE_PROMPT_SYSTEM, userPrompt);
      } catch (e: any) {
        results.image = `生成失败: ${e.message}`;
      }
    }

    if (type === 'video' || type === 'batch') {
      const selectedPlatforms = platforms || ['xiaohongshu'];
      const videoPromises = selectedPlatforms.map(async (p: string) => {
        const platformInfo = PLATFORM_PROMPTS[p];
        const platformName = platformInfo ? p : '通用';
        const userPrompt = `产品/主题：${product}\n目标平台：${platformName}\n${extra ? `额外要求：${extra}` : ''}\n视频时长：30-60秒`;
        try {
          const content = await callDoubao(VIDEO_SCRIPT_SYSTEM, userPrompt);
          return { platform: p, content };
        } catch (e: any) {
          return { platform: p, content: `生成失败: ${e.message}` };
        }
      });
      const videoResults = await Promise.all(videoPromises);
      results.video = videoResults;
    }

    return new JSONResponse({ success: true, results });
  } catch (e: any) {
    return new JSONResponse({ error: e.message || '请求失败' }, { status: 400 });
  }
};
