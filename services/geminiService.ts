
import { GoogleGenAI } from "@google/genai";

/**
 * 指向性保护协议 (Directional Protection Protocol):
 * 1. 严格标签隔离：使用 XML 风格标签包裹不同性质的输入。
 * 2. 职责唯一性：明确原著是剧情的唯一来源，参考文件禁止贡献任何情节。
 * 3. 进度锚定协议：确保脚本生成不跨越规划阶段，解决节奏过快问题。
 */

export const generateStoryOutline = async (
  originalText: string,
  layoutRefText: string,
  styleRefText: string
) => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const model = 'gemini-3-pro-preview';
  
  const prompt = `
    你现在是一名专业的漫剧总编剧。你的任务是基于【原著小说内容】创作深度大纲。
    
    【输入指令 - 优先级声明】：
    1. <ORIGINAL_NOVEL> 标签内是【唯一剧情来源】。严禁从其他标签中提取任何人物、背景或事件。
    2. <STYLE_REFERENCE> 标签内仅用于【词汇与语气参考】。
    3. <LAYOUT_TEMPLATE> 标签内仅用于【排版符号参考】。

    <ORIGINAL_NOVEL>
    ${originalText}
    </ORIGINAL_NOVEL>

    <STYLE_REFERENCE>
    ${styleRefText || '无特定的文笔参考，请保持人类化的爽剧叙事感。'}
    </STYLE_REFERENCE>

    <LAYOUT_TEMPLATE>
    ${layoutRefText || '无特定排版模版。'}
    </LAYOUT_TEMPLATE>

    【核心任务 - 阶段化规划】：
    在生成 2000-3000 字大纲之前，必须首先输出一份【剧本进度路线图】，确保 60-80 集的体量。
    格式要求：
    ---
    【剧本进度路线图】
    第 1-10 集：[阶段标题] | 原著对应章节：[第X章-第Y章] | 核心剧情钩子：...
    第 11-20 集：[阶段标题] | 原著对应章节：[第Y+1章-第Z章] | 核心剧情钩子：...
    （依此类推，覆盖 60-80 集全篇）
    ---

    【大纲创作要求】：
    - **逻辑溯源**：确保大纲中的每一个冲突都直接源自 <ORIGINAL_NOVEL>。
    - **节奏控制**：大纲内容必须详尽，尤其是前中期的铺垫，禁止直接写结局，要为 60-80 集预留足够的冲突空间。
    - **视觉克隆**：如果 <LAYOUT_TEMPLATE> 中使用了特殊的括号（如【】）或分段标记，请在输出中完整复刻。
    - **输出目标**：先输出《剧本进度路线图》，再输出 2000-3000 字的深度大纲。

    请开始分析并生成。
  `;

  const response = await ai.models.generateContent({
    model,
    contents: prompt,
    config: {
      temperature: 0.85,
      thinkingConfig: { thinkingBudget: 6000 }
    }
  });

  return response.text;
};

export const generateScriptSegment = async (
  batchIndex: number,
  mode: 'male' | 'female',
  originalText: string,
  outlineText: string,
  previousScripts: string,
  layoutRefText: string,
  styleRefText: string
) => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const model = 'gemini-3-pro-preview';

  const startEp = (batchIndex - 1) * 3 + 1;
  const endEp = batchIndex * 3;
  const contextHistory = previousScripts ? previousScripts.substring(previousScripts.length - 12000) : '无往期脚本';

  const prompt = `
    任务：编写动漫脚本 第 ${startEp} - ${endEp} 集。
    频道：${mode === 'male' ? '男频' : '女频'}

    【当前执行进度与关联约束】：
    1. **阶段定位**：请从 <STORY_OUTLINE> 的【剧本进度路线图】中找到涵盖第 ${startEp}-${endEp} 集的阶段。
    2. **进度锁死**：你现在的任务是极度细腻地展开该阶段对应的剧情。**严禁**提及或推进后续阶段的任何情节。
    3. **扩容系数**：为了保证 60-80 集的体量，大纲中的一个细微剧情点（哪怕一句话），你必须扩充为至少 3-5 场完整的戏。

    【输入隔离与职责】：
    - <ORIGINAL_SOURCE>：提供本集的核心细节。
    - <STORY_OUTLINE>：包含全局路线图和剧情框架。
    - <PREVIOUS_CONTEXT>：提供上下文衔接状态。
    - <STYLE_AND_LAYOUT>：文笔与格式参考。

    <ORIGINAL_SOURCE>
    ${originalText.substring(0, 15000)}
    </ORIGINAL_SOURCE>

    <STORY_OUTLINE>
    ${outlineText}
    </STORY_OUTLINE>

    <PREVIOUS_CONTEXT>
    ${contextHistory}
    </PREVIOUS_CONTEXT>

    <STYLE_AND_LAYOUT>
    文笔风格：${styleRefText}
    排版模版：${layoutRefText}
    </STYLE_AND_LAYOUT>

    【脚本生成准则】：
    1. **慢节奏叙事**：禁止使用“很快”、“转眼间”、“于是”等总结性词汇。必须写出具体的环境压抑感、角色的眼神交流、台词间的拉扯。
    2. **上下文锚定**：分析 <PREVIOUS_CONTEXT> 最后一段，确保第 ${startEp} 集第一秒无缝连接。
    3. **去AI痕迹**：多用动词和神态描写，不要写类似“他意识到自己应该...”这种心理说明，要写出他具体的动作。

    输出中文纯文本脚本。
  `;

  const response = await ai.models.generateContent({
    model,
    contents: prompt,
    config: {
      temperature: 0.9,
      topP: 0.95,
      thinkingConfig: { thinkingBudget: 8000 }
    }
  });

  return response.text;
};
