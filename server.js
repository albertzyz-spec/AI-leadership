const express = require("express");
const path = require("path");
const cors = require("cors");
const fs = require("fs");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 3000;
const DATA_DIR = process.env.DATA_DIR || "./data/sessions";

fs.mkdirSync(DATA_DIR, { recursive: true });

app.use(cors());
app.use(express.json());
app.use((req, res, next) => {
  const start = Date.now();
  res.on("finish", () => {
    const ms = Date.now() - start;
    console.log(`${req.method} ${req.path} ${res.statusCode} ${ms}ms`);
  });
  next();
});
app.use(express.static(path.join(__dirname, "public")));

const sessions = new Map();

// ─── Dimension Definitions ────────────────────────────────────────────────────

const DIMENSIONS = {
  R1: { name: "人机工作流重构",         nameEn: "AI-Human Workflow Reconstruction",          weight: 10, group: "role" },
  R2: { name: "关键资源蓄积与生态构建", nameEn: "Key Resource Accumulation & Ecosystem",      weight: 10, group: "role" },
  R3: { name: "战略定向与组织稳定",     nameEn: "Strategic Direction & Org Stability",        weight: 10, group: "role" },
  R4: { name: "人机体系监督与结果兜底", nameEn: "AI-Human System Oversight & Accountability", weight: 10, group: "role" },
  R5: { name: "团队能力动态更新",       nameEn: "Dynamic Team Capability Updating",           weight: 10, group: "role" },
  C1: { name: "人机边界理解与AI流利度", nameEn: "AI-Human Boundary Understanding & Fluency",  weight: 10, group: "capability" },
  C2: { name: "AI场景落地与工作流设计", nameEn: "AI Scenario Implementation & Workflow Design",weight: 10, group: "capability" },
  C3: { name: "乐观与韧性",             nameEn: "Optimism & Resilience",                      weight: 10, group: "capability" },
  C4: { name: "复杂问题解构与解决",     nameEn: "Complex Problem Decomposition & Resolution", weight: 10, group: "capability" },
  C5: { name: "同理心与团队激发",       nameEn: "Empathy & Team Inspiration",                 weight: 10, group: "capability" }
};

// ─── L1–L5 Behavioral Anchors ─────────────────────────────────────────────────

const DIMENSION_ANCHORS = {
  R1: {
    L1: "不理解AI与人的本质差异，工作流未因AI而改变，或盲目'全自动'导致失控",
    L2: "有意识引入AI工具，但工作流改造停留在个人层面，缺乏系统性设计",
    L3: "能为特定场景设计人机分工，有基本的质检和人工审核节点，但覆盖范围有限",
    L4: "系统性重构多个核心工作流，清晰界定AI执行/人类判断/人工兜底的层次与触发条件",
    L5: "建立可复制的工作流重构方法论，在组织内推广，持续迭代，引领整体生产方式升级"
  },
  R2: {
    L1: "资源分配被动、平均，无法提供让他人'无法拒绝'的稀缺价值，人才与合作方流失",
    L2: "能识别稀缺资源，但获取和整合能力有限，生态连接主要依赖现有关系",
    L3: "能提供部分差异化资源（如行业洞见、内部算力），开始构建有价值的外部连接",
    L4: "持续输出高价值稀缺资源（洞见、关系、算力、资金），形成吸引人与Agent聚集的磁场",
    L5: "建立了自我增强的生态体系：越多人/Agent参与，产生的价值越大，形成正循环"
  },
  R3: {
    L1: "方向摇摆或保持沉默，团队在信息爆炸中各自为政，情感上无人托底",
    L2: "能传达方向，但缺乏对不确定性的显性管理，团队焦虑时无有效应对",
    L3: "在关键节点能明确阶段目标，提供一定情感支持，但节奏管理较被动",
    L4: "主动区分'已确定/待验证'，通过定期沟通维持团队确定感，情感支持有实质行动",
    L5: "在持续变化中建立共识机制，将不确定性转化为团队学习，成为组织的'定海神针'"
  },
  R4: {
    L1: "对复杂人机系统的运行缺乏监控，问题暴露后才被动响应，责任归属模糊",
    L2: "有基本跟踪，但主要靠人工观察，无法识别AI链条中的隐性风险",
    L3: "建立了部分预警指标，能识别常见问题，但复杂系统失效时处置能力不足",
    L4: "建立完整的'监控-预警-干预-归因'闭环，能主动发现AI体系中的隐性问题并处置",
    L5: "将个人兜底升级为体系兜底，跨人机边界的责任机制成熟，组织级风险免疫力强"
  },
  R5: {
    L1: "按固定岗位分工，对AI时代的能力缺口缺乏感知，团队能力更新缓慢",
    L2: "意识到能力需要更新，但行动迟缓，主要等招聘解决，缺乏即时补位机制",
    L3: "能识别关键能力缺口，开始执行培养计划或引入外借人才，但决策不够果决",
    L4: "对团队能力有高度敏锐度，快速决策：外借、内培或重组，能力更新节奏与业务匹配",
    L5: "将能力动态更新制度化，团队能力地图随业务变化实时刷新，形成持续进化的组织"
  },
  C1: {
    L1: "对AI能力边界模糊，过度依赖或过度怀疑AI，无法有效承担工作流结果责任",
    L2: "了解AI基本能力，但对其局限性理解浅，使用方式随机，产出质量不稳定",
    L3: "能判断哪些任务适合AI，工具使用有一定规范，但系统性验证和责任边界不清晰",
    L4: "深刻理解AI与人的能力边界，能据此设计工作流、验证产出，并为结果承担明确责任",
    L5: "成为团队的'人机边界判断标准'，持续更新认知，引导他人正确理解和使用AI"
  },
  C2: {
    L1: "没有成功落地AI的经验，或因方法缺失导致落地失败、场景选择错误",
    L2: "尝试过AI落地但缺乏方法，场景选择随机，无业务价值量化，难以扩展",
    L3: "能选合适场景做试点，有基本的评估意识，但从试点到规模化的路径不清",
    L4: "有'识别场景-试点-验证ROI-规模化'的完整路径，工作流设计能直接提升业务效率",
    L5: "建立可复制的AI落地方法论，多场景成功应用，形成组织级工作流设计能力"
  },
  C3: {
    L1: "在技术变化和不确定性中表现焦虑或悲观，向团队传递负面情绪，难以自我恢复",
    L2: "个人能勉强承压，但无法主动调适，对团队的情绪托底和鼓舞作用有限",
    L3: "个人有基本调适方法，在困境中能保持稳定，但鼓舞团队的方式较被动",
    L4: "在连续变化和挫折中保持乐观，有主动的自我调适机制，并以此真实感染团队",
    L5: "乐观与韧性成为团队文化的一部分，能将外部压力转化为集体成长的动力"
  },
  C4: {
    L1: "面对复杂问题停留在现象层，依赖直觉或权威决策，无有效拆解方法",
    L2: "能描述问题但缺少假设验证意识，解决方案偏单一或直觉驱动",
    L3: "能进行基本拆解，假设较明确，但验证标准模糊，决策节点不清晰",
    L4: "完整执行'问题框定-假设显性化-验证-决策'流程，避免大投入的未验证假设",
    L5: "将复杂问题解构能力方法论化，带动团队共建，形成组织级结构化决策文化"
  },
  C5: {
    L1: "以任务和AI效率为中心，忽视人类员工处境，团队在人机竞争焦虑中无人托底",
    L2: "能感知成员情绪，但理解浮于表面，激发方式以压力驱动为主",
    L3: "能主动关注成员诉求，有调节冲突的意愿，但系统性激发机制不完整",
    L4: "深度理解人类员工在人机协作中的处境与价值感，用共情建立信任，促成自发协作",
    L5: "形成以人为本的协作文化，让每个人在AI时代都感到被理解和被需要，激发最大创造力"
  }
};

// ─── Utilities ────────────────────────────────────────────────────────────────

function uid() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

function clampScore(v) {
  return Math.max(1, Math.min(5, Number(v) || 3));
}

// ─── DeepSeek API ─────────────────────────────────────────────────────────────

// Extract JSON from model output — handles markdown code blocks and extra text
function extractJSON(raw) {
  const s = (raw || "").trim();

  // 1. Direct parse
  try { return JSON.parse(s); } catch {}

  // 2. Strip markdown code fence: ```json ... ``` or ``` ... ```
  const fenceMatch = s.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (fenceMatch) {
    try { return JSON.parse(fenceMatch[1].trim()); } catch {}
  }

  // 3. Find first { ... } block
  const braceStart = s.indexOf("{");
  const braceEnd = s.lastIndexOf("}");
  if (braceStart !== -1 && braceEnd > braceStart) {
    try { return JSON.parse(s.slice(braceStart, braceEnd + 1)); } catch {}
  }

  console.error("[extractJSON] Failed to parse. Raw content:\n", s.slice(0, 500));
  throw new Error("AI returned invalid JSON — please retry");
}

// Fetch with timeout using AbortController
async function fetchWithTimeout(url, options, timeoutMs) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

async function callDeepSeekChat(messages, retries = 2) {
  const apiKey = process.env.DEEPSEEK_API_KEY;
  if (!apiKey) throw new Error("DEEPSEEK_API_KEY not configured");

  const model = process.env.DEEPSEEK_CHAT_MODEL || "deepseek-chat";
  let lastError;

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const response = await fetchWithTimeout(
        "https://api.deepseek.com/chat/completions",
        {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
          body: JSON.stringify({
            model,
            messages,
            temperature: 0.7,
            response_format: { type: "json_object" }
          })
        },
        60000 // 60s timeout
      );

      if (!response.ok) {
        const err = await response.text();
        throw new Error(`DeepSeek chat error ${response.status}: ${err.slice(0, 200)}`);
      }

      const data = await response.json();
      const content = data.choices?.[0]?.message?.content || "{}";
      return extractJSON(content);
    } catch (err) {
      lastError = err;
      if (attempt < retries) {
        console.warn(`[callDeepSeekChat] attempt ${attempt + 1} failed: ${err.message}. Retrying...`);
        await new Promise(r => setTimeout(r, 1500 * (attempt + 1)));
      }
    }
  }

  throw lastError;
}

async function callDeepSeekReasoner(prompt) {
  const apiKey = process.env.DEEPSEEK_API_KEY;
  if (!apiKey) throw new Error("DEEPSEEK_API_KEY not configured");

  const model = process.env.DEEPSEEK_REASONER_MODEL || "deepseek-reasoner";
  const response = await fetchWithTimeout(
    "https://api.deepseek.com/chat/completions",
    {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({
        model,
        messages: [{ role: "user", content: prompt }],
        temperature: 1
      })
    },
    180000 // 3 min timeout for R1 deep reasoning
  );

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`DeepSeek reasoner error ${response.status}: ${err}`);
  }

  const data = await response.json();
  return data.choices?.[0]?.message?.content || "";
}

// ─── Assessment System Prompt ─────────────────────────────────────────────────

function buildSystemPrompt(session) {
  const isEn = session.language === "en";
  const lang = isEn ? "English" : "中文";

  const coveredCount = Object.values(session.dimensionCoverage).filter(v => v.turns > 0).length;
  const uncovered = Object.entries(session.dimensionCoverage)
    .filter(([, v]) => v.turns === 0)
    .map(([k]) => k)
    .join(", ");

  const dimensionBlock = Object.entries(DIMENSIONS).map(([id, dim]) => {
    const cov = session.dimensionCoverage[id];
    const avgScore = cov.scores.length
      ? (cov.scores.reduce((a, b) => a + b, 0) / cov.scores.length).toFixed(1)
      : "未评分";
    const anchors = DIMENSION_ANCHORS[id];
    return `[${id}: ${dim.name} | ${dim.group} | 已问${cov.turns}次 | 当前分${avgScore}]
  L1(1.0-1.8): ${anchors.L1}
  L2(1.9-2.7): ${anchors.L2}
  L3(2.8-3.5): ${anchors.L3}
  L4(3.6-4.4): ${anchors.L4}
  L5(4.5-5.0): ${anchors.L5}`;
  }).join("\n\n");

  return `你是专业的AI时代领导力评估顾问，通过自然对话评估领导者在10个维度的能力。

被评估人: ${session.userName}，角色: ${session.userRole}
当前轮次: ${session.turnCount} | 已覆盖维度: ${coveredCount}/10
未覆盖维度: ${uncovered || "全部已覆盖"}
上一题评估的维度: ${session.currentDimension || "无（介绍阶段）"}
当前阶段: ${session.phase}
回复语言: 全程使用${lang}

━━━ 10维度评估框架 ━━━
${dimensionBlock}

━━━ 本轮任务 ━━━
1. 【评分】若phase为'assessment'且currentDimension不为null，对用户刚才的回答按对应维度L1-L5锚点严格评分：
   - 分数1.0-5.0（精确到0.1），必须引用用户原话作为依据
   - 回答充分（含具体案例/数字/权衡/反思）→ followUp: false，切换维度
   - 回答模糊/过短/一句话 → followUp: true，但同一维度最多追问【1次】，turns>=1则强制切换
   - ⚠️ 极短回答（<10字、仅表态如"好的""明白""嗯"）→ 照常返回合法JSON，score=1.5-2.0，followUp:true，友善追问具体案例

2. 【选下一维度】优先选turns=0的维度；若followUp则继续当前维度
   ⚠️ 轮次>=15时：禁止followUp，每轮必须切换到新维度，优先覆盖剩余维度

3. 【生成问题】结合用户背景与前序回答，问题自然有温度，不像问卷调查
   轮次>=15时问题可以合并2个相近维度，提升覆盖效率

4. 【判断结束】done: true条件：已覆盖≥9维度 且 轮次≥10，或 轮次>=20

5. 【intro阶段】phase='intro'时：温和回应用户介绍，scoredDimension和score设null，提出第一个评估问题

⚠️ 无论用户回答多短多模糊，必须返回合法JSON，禁止在JSON外添加任何解释文字

━━━ 返回严格JSON（不要有其他任何文字）━━━
{
  "reply": "对用户本轮回答的自然语言回应（温和、专业、有共情，用${lang}）",
  "scoredDimension": "R1",
  "score": 3.5,
  "reasoning": "打分依据，必须引用用户原话",
  "followUp": false,
  "nextQuestion": "下一个问题（用${lang}）",
  "nextDimension": "R2",
  "done": false
}`;
}

// ─── Report Prompt ────────────────────────────────────────────────────────────

function buildReportPrompt(session, dimensionScores, overall) {
  const isEn = session.language === "en";
  const lang = isEn ? "English" : "中文";

  const scoreLines = Object.entries(dimensionScores).map(([id, score]) => {
    const dim = DIMENSIONS[id];
    const cov = session.dimensionCoverage[id];
    const evidence = cov.evidence.slice(0, 2).join("；") || "（无直接引用）";
    const level = score >= 4.5 ? "L5卓越" : score >= 3.6 ? "L4稳健" : score >= 2.8 ? "L3发展中" : score >= 1.9 ? "L2初步具备" : "L1待强化";
    return `${id} ${dim.name}（${dim.group}）: ${score}/5 ${level} — 证据: ${evidence}`;
  }).join("\n");

  const answerSummary = session.answers
    .map(a => `[${a.dimension}轮${a.turn}] ${a.answer.slice(0, 160)}`)
    .join("\n");

  return `你是资深AI时代领导力顾问。基于以下评估数据生成专业领导力发展报告，全程使用${lang}。

被评估人: ${session.userName}，角色: ${session.userRole}
综合得分: ${overall}/5 | 对话轮次: ${session.turnCount}

各维度评分与证据:
${scoreLines}

关键回答摘录:
${answerSummary}

报告结构要求:
1. 综合评价（200-280字）：先肯定投入和核心优势，再指出关键成长方向，语气温和鼓励
2. 10个维度逐条分析，每条包含：当前等级、事实依据（引用原话）、深层判断、30/60/90天具体行动计划
3. 整体发展路线图（30/60/90天，跨维度整合）
4. 结尾一句温暖务实的鼓励

语言要求: 专业但不生硬，有洞见但不说教，避免空话套话`;
}

// ─── Fallback Report ──────────────────────────────────────────────────────────

function buildFallbackReport(session, dimensionScores, overall) {
  const sorted = Object.entries(dimensionScores).sort((a, b) => b[1] - a[1]);
  const top2 = sorted.slice(0, 2).map(([k]) => DIMENSIONS[k].name).join("、");
  const bottom2 = sorted.slice(-2).map(([k]) => DIMENSIONS[k].name).join("、");

  const lines = Object.entries(dimensionScores).map(([id, score]) => {
    const dim = DIMENSIONS[id];
    const level = score >= 4.5 ? "L5卓越" : score >= 3.6 ? "L4稳健" : score >= 2.8 ? "L3发展中" : score >= 1.9 ? "L2初步具备" : "L1待强化";
    return `${id} ${dim.name}: ${score}/5（${level}）`;
  }).join("\n");

  return `【AI领导力综合评价】
综合得分 ${overall}/5。在 ${top2} 方面表现突出；${bottom2} 仍有提升空间。

【各维度评分】
${lines}

建议持续实践，定期复盘，在AI时代保持学习与成长。（注：本报告为基础版，如需AI深度分析请检查DeepSeek API配置。）`;
}

// ─── File Storage ─────────────────────────────────────────────────────────────

function saveOrUpdateSession(session, extra = {}) {
  const filepath = path.join(DATA_DIR, `${session.sessionId}.json`);
  const record = {
    sessionId: session.sessionId,
    userName: session.userName,
    userRole: session.userRole,
    language: session.language,
    startedAt: new Date(session.startedAt).toISOString(),
    lastActivityAt: new Date().toISOString(),
    completedAt: extra.completedAt || null,
    status: extra.status || "in_progress",
    turnCount: session.turnCount,
    answers: session.answers,
    dimensionScores: extra.dimensionScores || null,
    overallScore: extra.overallScore || null,
    report: extra.report || null
  };
  try {
    fs.writeFileSync(filepath, JSON.stringify(record, null, 2), "utf-8");
  } catch (err) {
    console.error("[saveOrUpdateSession] Failed:", err.message);
  }
}

// ─── API Routes ───────────────────────────────────────────────────────────────

app.post("/api/start", (req, res) => {
  const { userName = "匿名用户", userRole = "未填写", language = "zh" } = req.body || {};
  const sessionId = uid();

  const dimensionCoverage = {};
  Object.keys(DIMENSIONS).forEach(id => {
    dimensionCoverage[id] = { turns: 0, scores: [], evidence: [] };
  });

  const session = {
    sessionId,
    userName,
    userRole,
    language,
    conversationHistory: [],
    dimensionCoverage,
    currentDimension: null,
    currentQuestion: null,
    turnCount: 0,
    phase: "intro",
    answers: [],
    startedAt: Date.now()
  };

  const openingZh = `你好，${userName}！很高兴认识你。在开始之前，能简单聊聊你自己吗？比如你目前做什么、负责什么——完全由你决定分享什么，没有固定格式。`;
  const openingEn = `Hi ${userName}! Great to meet you. Before we start, could you tell me a bit about yourself? What you do, what you're responsible for — completely up to you what to share, no fixed format needed.`;
  const openingMessage = language === "en" ? openingEn : openingZh;

  session.conversationHistory.push({ role: "assistant", content: openingMessage });
  sessions.set(sessionId, session);

  res.json({ sessionId, openingMessage });
});

app.post("/api/chat", async (req, res) => {
  const { sessionId, message } = req.body || {};
  const session = sessions.get(sessionId);

  if (!session) return res.status(404).json({ error: "会话不存在，请重新开始。" });
  if (session.phase === "done") return res.status(400).json({ error: "评估已完成，请查看报告。" });
  if (!message || !message.trim()) return res.status(400).json({ error: "消息不能为空。" });

  session.conversationHistory.push({ role: "user", content: message.trim() });

  const systemPrompt = buildSystemPrompt(session);
  const messages = [
    { role: "system", content: systemPrompt },
    ...session.conversationHistory
  ];

  let aiResult;
  try {
    aiResult = await callDeepSeekChat(messages);
  } catch (err) {
    session.conversationHistory.pop(); // remove user message on failure
    sessions.set(sessionId, session);
    return res.status(500).json({ error: `AI调用失败: ${err.message}` });
  }

  const {
    reply = "",
    scoredDimension = null,
    score = null,
    reasoning = "",
    followUp = false,
    nextQuestion = "",
    nextDimension = null,
    done = false
  } = aiResult;

  // Record score if applicable
  if (scoredDimension && score !== null && session.dimensionCoverage[scoredDimension]) {
    const validScore = clampScore(score);
    const cov = session.dimensionCoverage[scoredDimension];
    cov.scores.push(validScore);
    cov.turns += 1;
    if (reasoning) cov.evidence.push(reasoning.slice(0, 200));

    session.answers.push({
      turn: session.turnCount + 1,
      dimension: scoredDimension,
      question: session.currentQuestion || "",
      answer: message.trim(),
      score: validScore,
      reasoning: reasoning.slice(0, 200)
    });
  }

  session.turnCount += 1;
  session.currentDimension = nextDimension || scoredDimension;

  if (session.phase === "intro") session.phase = "assessment";
  if (done) session.phase = "done";

  // Store combined assistant message in history
  const fullAssistant = done ? reply : `${reply}${nextQuestion ? `\n\n${nextQuestion}` : ""}`;
  session.conversationHistory.push({ role: "assistant", content: fullAssistant });
  session.currentQuestion = done ? null : nextQuestion;
  sessions.set(sessionId, session);
  saveOrUpdateSession(session);

  const coveredCount = Object.values(session.dimensionCoverage).filter(v => v.turns > 0).length;

  res.json({
    reply,
    nextQuestion: done ? null : nextQuestion,
    nextDimension,
    done,
    progress: { turn: session.turnCount, coveredDimensions: coveredCount, totalDimensions: 10 }
  });
});

app.post("/api/report", async (req, res) => {
  const { sessionId } = req.body || {};
  const session = sessions.get(sessionId);
  if (!session) return res.status(404).json({ error: "会话不存在，请重新开始。" });

  // Compute dimension scores — later rounds weighted more
  const dimensionScores = {};
  Object.entries(session.dimensionCoverage).forEach(([id, cov]) => {
    if (!cov.scores.length) { dimensionScores[id] = 3; return; }
    const { sum, totalWeight } = cov.scores.reduce(
      (acc, s, i) => ({ sum: acc.sum + s * (i + 1), totalWeight: acc.totalWeight + (i + 1) }),
      { sum: 0, totalWeight: 0 }
    );
    dimensionScores[id] = +(sum / totalWeight).toFixed(2);
  });

  const overall = +(Object.values(dimensionScores).reduce((a, b) => a + b, 0) / 10).toFixed(2);

  let report = "";
  try {
    const prompt = buildReportPrompt(session, dimensionScores, overall);
    report = await callDeepSeekReasoner(prompt);
  } catch (err) {
    console.error("Reasoner failed, using fallback:", err.message);
    report = buildFallbackReport(session, dimensionScores, overall);
  }

  // Radar data
  const roleIds = ["R1", "R2", "R3", "R4", "R5"];
  const capIds = ["C1", "C2", "C3", "C4", "C5"];
  const isEn = session.language === "en";

  const radar = {
    roleRadar: {
      labels: roleIds.map(id => isEn ? DIMENSIONS[id].nameEn : DIMENSIONS[id].name),
      values: roleIds.map(id => dimensionScores[id])
    },
    capabilityRadar: {
      labels: capIds.map(id => isEn ? DIMENSIONS[id].nameEn : DIMENSIONS[id].name),
      values: capIds.map(id => dimensionScores[id])
    }
  };

  // Save file
  saveOrUpdateSession(session, {
    status: "completed",
    completedAt: new Date().toISOString(),
    report,
    dimensionScores,
    overallScore: overall
  });
  const savedFile = `${session.sessionId}.json`;

  const dimensionDetails = Object.entries(dimensionScores).map(([id, score]) => ({
    id,
    name: isEn ? DIMENSIONS[id].nameEn : DIMENSIONS[id].name,
    score,
    weight: DIMENSIONS[id].weight,
    group: DIMENSIONS[id].group,
    level: score >= 4.5 ? "L5" : score >= 3.6 ? "L4" : score >= 2.8 ? "L3" : score >= 1.9 ? "L2" : "L1"
  }));

  res.json({
    user: { name: session.userName, role: session.userRole },
    scores: { overall, dimensions: dimensionDetails },
    radar,
    report,
    savedFile
  });
});

app.get("/api/health", (req, res) => {
  res.json({ ok: true, dataDir: DATA_DIR });
});

// ─── Admin ────────────────────────────────────────────────────────────────────

function requireAdmin(req, res, next) {
  const pw = req.headers["x-admin-password"] || req.query.pw;
  if (!process.env.ADMIN_PASSWORD || pw === process.env.ADMIN_PASSWORD) {
    return next();
  }
  res.status(401).json({ error: "Unauthorized" });
}

app.get("/admin/api/sessions", requireAdmin, (req, res) => {
  try {
    const files = fs.readdirSync(DATA_DIR).filter(f => f.endsWith(".json"));
    const list = files.map(f => {
      try {
        const data = JSON.parse(fs.readFileSync(path.join(DATA_DIR, f), "utf-8"));
        // normalize old format (name_timestamp.json) and new format (sessionId.json)
        const status = data.status || (data.completedAt ? "completed" : "in_progress");
        const lastActivityAt = data.lastActivityAt || data.completedAt || data.startedAt;
        return {
          sessionId: data.sessionId || f.replace(".json", ""),
          userName: data.userName,
          userRole: data.userRole,
          language: data.language,
          startedAt: data.startedAt,
          lastActivityAt,
          completedAt: data.completedAt,
          status,
          turnCount: data.turnCount,
          overallScore: data.overallScore
        };
      } catch { return null; }
    }).filter(Boolean);
    list.sort((a, b) => new Date(b.startedAt) - new Date(a.startedAt));
    res.json({ sessions: list });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get("/admin/api/sessions/:id", requireAdmin, (req, res) => {
  const id = req.params.id.replace(/[^a-zA-Z0-9-]/g, "");
  // Try direct filename match first (new format)
  const directPath = path.join(DATA_DIR, `${id}.json`);
  if (fs.existsSync(directPath)) {
    try {
      return res.json(JSON.parse(fs.readFileSync(directPath, "utf-8")));
    } catch { return res.status(500).json({ error: "Failed to read file" }); }
  }
  // Fall back: scan all files for matching sessionId (old format)
  try {
    const files = fs.readdirSync(DATA_DIR).filter(f => f.endsWith(".json"));
    for (const f of files) {
      try {
        const data = JSON.parse(fs.readFileSync(path.join(DATA_DIR, f), "utf-8"));
        if (data.sessionId === id) return res.json(data);
      } catch {}
    }
  } catch {}
  res.status(404).json({ error: "Session not found" });
});

app.patch("/admin/api/sessions/:id", requireAdmin, (req, res) => {
  const id = req.params.id.replace(/[^a-zA-Z0-9-]/g, "");
  const allowed = ["userName", "userRole"];
  const updates = Object.fromEntries(Object.entries(req.body || {}).filter(([k]) => allowed.includes(k)));
  if (!Object.keys(updates).length) return res.status(400).json({ error: "No valid fields to update" });

  const directPath = path.join(DATA_DIR, `${id}.json`);
  let filePath = directPath;
  if (!fs.existsSync(directPath)) {
    try {
      const files = fs.readdirSync(DATA_DIR).filter(f => f.endsWith(".json"));
      for (const f of files) {
        try {
          const d = JSON.parse(fs.readFileSync(path.join(DATA_DIR, f), "utf-8"));
          if (d.sessionId === id) { filePath = path.join(DATA_DIR, f); break; }
        } catch {}
      }
    } catch {}
  }
  if (!fs.existsSync(filePath)) return res.status(404).json({ error: "Session not found" });
  try {
    const data = JSON.parse(fs.readFileSync(filePath, "utf-8"));
    Object.assign(data, updates);
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), "utf-8");
    res.json({ ok: true, updated: updates });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/admin/api/sessions/restore", requireAdmin, (req, res) => {
  const data = req.body;
  if (!data || !data.sessionId) return res.status(400).json({ error: "Invalid session data" });
  const id = data.sessionId.replace(/[^a-zA-Z0-9-]/g, "");
  const filePath = path.join(DATA_DIR, `${id}.json`);
  try {
    fs.mkdirSync(DATA_DIR, { recursive: true });
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), "utf-8");
    res.json({ ok: true, sessionId: id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── Start ────────────────────────────────────────────────────────────────────

function startServer(preferredPort, maxRetries = 10) {
  let port = Number(preferredPort) || 3000;
  let attempts = 0;
  const launch = () => {
    const server = app.listen(port, () => {
      console.log(`AI Leadership app running at http://localhost:${port}`);
      console.log(`Data directory: ${path.resolve(DATA_DIR)}`);
    });
    server.on("error", (err) => {
      if (err.code === "EADDRINUSE" && attempts < maxRetries) {
        attempts += 1;
        port += 1;
        launch();
        return;
      }
      console.error("Failed to start server:", err.message);
      process.exit(1);
    });
  };
  launch();
}

startServer(PORT);
