const express = require("express");
const path = require("path");
const cors = require("cors");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

const sessions = new Map();

const DIMENSIONS = {
  R1: { name: "人机架构设计", weight: 10, group: "role" },
  R2: { name: "战略定向与组织稳定", weight: 10, group: "role" },
  R3: { name: "结果治理与责任兜底", weight: 10, group: "role" },
  R4: { name: "资源整合与生态构建", weight: 10, group: "role" },
  R5: { name: "团队能力编排与升级", weight: 10, group: "role" },
  C1: { name: "AI工具流利度", weight: 10, group: "capability" },
  C2: { name: "AI场景落地能力", weight: 10, group: "capability" },
  C3: { name: "复杂问题解构能力", weight: 10, group: "capability" },
  C4: { name: "韧性与压力调适", weight: 10, group: "capability" },
  C5: { name: "同理心与团队激发", weight: 10, group: "capability" }
};

const QUESTION_BANK = [
  {
    id: "q1",
    type: "text",
    kind: "open",
    prompt:
      "回顾一个你主导的人机协同流程改造项目，请按“背景-动作-权衡-结果”描述，尤其说明你如何划分AI与人的职责边界。",
    targetDimension: "R1"
  },
  {
    id: "q2",
    type: "choice",
    kind: "scenario",
    prompt:
      "你接手一个跨部门流程，团队希望“全自动”，但关键环节风险高。你会优先怎么做？",
    targetDimension: "R1",
    options: [
      {
        id: "q2o1",
        label: "先做高风险环节的人机分层试点，再逐步扩大自动化范围",
        score: 4.3
      },
      {
        id: "q2o2",
        label: "先满足多数诉求快速上线，再依赖监控和回滚控制风险",
        score: 3.7
      },
      {
        id: "q2o3",
        label: "先梳理流程责任与审计要求，延后自动化以确保合规",
        score: 3.5
      }
    ]
  },
  {
    id: "q3",
    type: "text",
    kind: "open",
    prompt:
      "请讲一个你在信息冲突、方向不清时稳定团队节奏的案例：你如何定阶段目标、沟通不确定性并保持执行。",
    targetDimension: "R2"
  },
  {
    id: "q4",
    type: "choice",
    kind: "scenario",
    prompt:
      "季度中途市场变化，原路线价值下降。你会如何处理团队方向？",
    targetDimension: "R2",
    options: [
      {
        id: "q4o1",
        label: "保留长期方向不变，新增短周期实验线并双轨推进",
        score: 4.2
      },
      {
        id: "q4o2",
        label: "立刻切换主路线，集中资源追赶新机会",
        score: 3.6
      },
      {
        id: "q4o3",
        label: "等待更多外部信号，暂时控制变更范围",
        score: 3.4
      }
    ]
  },
  {
    id: "q5",
    type: "text",
    kind: "open",
    prompt:
      "请描述一次你为结果“兜底”且成功纠偏的经历：你如何定义预警信号、触发机制和责任闭环。",
    targetDimension: "R3"
  },
  {
    id: "q6",
    type: "choice",
    kind: "scenario",
    prompt:
      "你所在团队同时缺算力、缺跨域专家，关键项目时间紧。你会优先怎么配置资源？",
    targetDimension: "R4",
    options: [
      {
        id: "q6o1",
        label: "压缩非关键需求，集中投入关键路径并引入外部专家短期补位",
        score: 4.2
      },
      {
        id: "q6o2",
        label: "各团队平均分配资源，确保整体公平",
        score: 3.3
      },
      {
        id: "q6o3",
        label: "优先采购算力，能力缺口后续再补",
        score: 3.7
      }
    ]
  },
  {
    id: "q7",
    type: "choice",
    kind: "scenario",
    prompt:
      "你发现团队技能结构和业务节奏错配，现有编制难以覆盖。你更可能怎么做？",
    targetDimension: "R5",
    options: [
      {
        id: "q7o1",
        label: "按任务拆分能力缺口，先外借关键角色并并行培养内部替补",
        score: 4.3
      },
      {
        id: "q7o2",
        label: "先维持现状，等待下个预算周期再调整组织结构",
        score: 3.2
      },
      {
        id: "q7o3",
        label: "快速招聘通才覆盖多任务，后续再细化分工",
        score: 3.8
      }
    ]
  },
  {
    id: "q8",
    type: "text",
    kind: "open",
    prompt:
      "请分享你最近一次把 AI 工具真正纳入管理工作流的实践：你如何选择工具、定义使用边界、验证产出质量？",
    targetDimension: "C1"
  },
  {
    id: "q9",
    type: "choice",
    kind: "scenario",
    prompt:
      "某业务团队希望接入AI，但历史流程复杂且数据质量一般。你会先做哪一步？",
    targetDimension: "C2",
    options: [
      {
        id: "q9o1",
        label: "先选一个低风险高频场景做小规模试点，再扩展到主流程",
        score: 4.2
      },
      {
        id: "q9o2",
        label: "先全流程接入，靠后续运营迭代修正问题",
        score: 3.3
      },
      {
        id: "q9o3",
        label: "先打磨高质量数据样本和评估标准，再开始局部接入",
        score: 4.0
      }
    ]
  },
  {
    id: "q10",
    type: "text",
    kind: "open",
    prompt:
      "面对一个跨团队且目标冲突的问题，请给出你最近一次的拆解过程：问题框定、关键假设、决策节点和验证结果。",
    targetDimension: "C3"
  },
  {
    id: "q11",
    type: "text",
    kind: "open",
    prompt:
      "请讲一个高压变化期你自我调适并稳定团队状态的案例，特别说明你如何处理连续失败或延迟。",
    targetDimension: "C4"
  },
  {
    id: "q12",
    type: "text",
    kind: "open",
    prompt:
      "请分享一次你在冲突场景中推动不同角色达成协作的经历：你如何识别真实诉求并促成共识。",
    targetDimension: "C5"
  }
];

function uid() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

function clampScore(v) {
  return Math.max(1, Math.min(5, Number(v) || 3));
}

function shuffleArray(arr) {
  const list = [...arr];
  for (let i = list.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [list[i], list[j]] = [list[j], list[i]];
  }
  return list;
}

function buildSessionQuestionSet() {
  return QUESTION_BANK.map((question) => {
    if (question.type !== "choice") return { ...question };
    return {
      ...question,
      options: shuffleArray(question.options)
    };
  });
}

function sanitizeQuestionForClient(question) {
  if (!question) return null;
  if (question.type !== "choice") {
    return {
      id: question.id,
      type: question.type,
      kind: question.kind,
      prompt: question.prompt
    };
  }
  return {
    id: question.id,
    type: question.type,
    kind: question.kind,
    prompt: question.prompt,
    options: question.options.map((option) => ({
      id: option.id,
      label: option.label
    }))
  };
}

function buildWarmOpeningMessage(userName, userRole, introProfile) {
  const roleText = userRole && userRole !== "未填写" ? `，目前担任${userRole}` : "";
  const focusText = introProfile?.assessmentGoal
    ? `我会重点关注你提到的“${introProfile.assessmentGoal}”。`
    : "我会结合你的回答，给出客观且有温度的反馈。";
  return `你好${userName}，感谢你愿意花时间参与这次评估${roleText}。在开始前，我会先了解你的实践方式与思考逻辑。${focusText}`;
}

function formatQuestionForConversation(question, current, total) {
  const safe = sanitizeQuestionForClient(question);
  if (!safe) return null;
  const head =
    current === 1
      ? "我们先从一个你熟悉的真实场景开始。"
      : "谢谢你的分享，接下来想继续请教你一个问题。";
  return {
    ...safe,
    prompt: `${head}\n\n（第${current}/${total}题）${safe.prompt}`
  };
}

function estimateTextScore(text) {
  if (!text || !text.trim()) return 2;
  const normalized = text.trim();
  let score = 2.2;

  const hasLength = normalized.length > 120;
  const hasAction = /(推动|协调|拆解|建立|制定|复盘|验证|改造|设计|对齐)/.test(
    normalized
  );
  const hasTradeoff = /(权衡|取舍|冲突|约束|优先级|风险)/.test(normalized);
  const hasMetric = /(\d+%|\d+天|\d+周|\d+次|\d+个|指标|量化|SLA|ROI)/.test(
    normalized
  );
  const hasReflection = /(复盘|反思|教训|改进|下次|迭代)/.test(normalized);

  if (hasLength) score += 0.5;
  if (hasAction) score += 0.6;
  if (hasTradeoff) score += 0.6;
  if (hasMetric) score += 0.7;
  if (hasReflection) score += 0.4;

  const vagueTone = /(赋能|积极|拥抱变化|持续优化|努力推进)/.test(normalized);
  const lacksEvidence = !hasMetric && !hasTradeoff && normalized.length < 90;
  if (vagueTone && lacksEvidence) {
    score = Math.min(score, 3.2);
  }

  return clampScore(score);
}

function computeDimensionScores(answers) {
  const acc = {};
  Object.keys(DIMENSIONS).forEach((key) => {
    acc[key] = [];
  });

  answers.forEach((item) => {
    const { question, answer } = item;
    if (!question || !question.targetDimension) return;
    const d = question.targetDimension;
    if (question.type === "choice") {
      const option = question.options.find((opt) => {
        if (answer.choiceId) return opt.id === answer.choiceId;
        if (Number.isInteger(answer.choiceIndex)) {
          return question.options[answer.choiceIndex]?.id === opt.id;
        }
        return false;
      });
      acc[d].push(option ? option.score : 3);
    } else {
      acc[d].push(estimateTextScore(answer.text));
    }
  });

  const result = {};
  Object.keys(DIMENSIONS).forEach((d) => {
    const values = acc[d];
    if (!values.length) {
      result[d] = 3;
      return;
    }
    const avg = values.reduce((s, n) => s + n, 0) / values.length;
    result[d] = Number(clampScore(avg).toFixed(2));
  });
  return result;
}

function computeOverallScore(dimensionScores) {
  const weighted = Object.entries(DIMENSIONS).reduce((acc, [key, meta]) => {
    return acc + (dimensionScores[key] || 3) * meta.weight;
  }, 0);
  return Number((weighted / 100).toFixed(2));
}

function buildRadarData(dimensionScores) {
  const roleRadar = {
    labels: ["人机架构设计", "战略定向与组织稳定", "结果治理与责任兜底", "资源整合与生态构建", "团队能力编排与升级"],
    values: [dimensionScores.R1, dimensionScores.R2, dimensionScores.R3, dimensionScores.R4, dimensionScores.R5]
  };

  const capabilityRadar = {
    labels: ["AI工具流利度", "AI场景落地能力", "复杂问题解构能力", "韧性与压力调适", "同理心与团队激发"],
    values: [dimensionScores.C1, dimensionScores.C2, dimensionScores.C3, dimensionScores.C4, dimensionScores.C5]
  };
  return { roleRadar, capabilityRadar };
}

function getScoreBand(score) {
  if (score >= 4.5) return "卓越";
  if (score >= 3.8) return "稳健";
  if (score >= 3.2) return "可提升";
  return "待强化";
}

function getDimensionSuggestion(id, score) {
  const level = getScoreBand(score);
  const map = {
    R1: {
      strong:
        "建议把你的人机分工方法沉淀为模板（任务拆解、质检门槛、人工兜底点），并在更多团队复制。",
      improve:
        "建议先挑一个高频场景做边界重画：明确“AI先做什么、人必须做什么、谁对结果签字”。"
    },
    R2: {
      strong:
        "建议保留你在不确定性中的叙事优势，进一步把“阶段目标+校准节奏”形成组织共识机制。",
      improve:
        "建议把方向沟通从“结论输出”升级为“假设-验证-决策点”透明化，降低团队不安与误判。"
    },
    R3: {
      strong:
        "建议把你的风险前置经验扩展为预警看板，形成可复用的责任闭环。",
      improve:
        "建议先补齐“预警阈值+触发机制+复盘归因”三件套，减少被动救火。"
    },
    R4: {
      strong:
        "建议将你的资源编排方式制度化，明确关键资源优先级与切换规则，提升组织抗压能力。",
      improve:
        "建议建立“稀缺资源分配准则”，把算力、专家与预算投入锚定到关键路径。"
    },
    R5: {
      strong:
        "建议继续强化能力地图与人才池机制，把“外借+培养+替补”节奏固定下来。",
      improve:
        "建议按任务而非岗位更新能力结构，优先补齐影响交付的关键缺口。"
    },
    C1: {
      strong:
        "建议将你对AI工具的使用经验写成团队SOP，提升整体使用一致性与质量。",
      improve:
        "建议先固定2-3个高价值工具栈，围绕提示词、评测与回退机制建立基本规范。"
    },
    C2: {
      strong:
        "建议把场景落地经验转化为“可复制落地包”，加速新场景推广。",
      improve:
        "建议优先跑通一个低风险高频场景，用业务指标验证价值后再扩展。"
    },
    C3: {
      strong:
        "建议继续放大你的问题拆解优势，沉淀“问题框定-假设-实验-决策”框架供团队复用。",
      improve:
        "建议在复杂问题中强制写出假设与验证标准，避免讨论停留在观点层。"
    },
    C4: {
      strong:
        "建议将你的韧性经验转化为团队节奏设计（峰谷调度、复盘节律、压力预案）。",
      improve:
        "建议建立个人与团队双层减压机制，尤其在连续失败场景保留反馈闭环。"
    },
    C5: {
      strong:
        "建议保留你的共情优势，同时把冲突调停方法结构化，提升跨角色协作效率。",
      improve:
        "建议在冲突处理中增加“复述对方诉求+共同目标确认”步骤，减少情绪性对抗。"
    }
  };
  const rule = map[id];
  if (!rule) return "建议保持复盘节奏，并围绕关键业务场景持续迭代。";
  return level === "卓越" || level === "稳健" ? rule.strong : rule.improve;
}

function getDimensionActionPlan(id, score) {
  const improve = score < 3.8;
  const actions = {
    R1: {
      d30: "梳理一个关键流程，画出“AI执行、人类判断、人工兜底”三层职责图并上线试运行。",
      d60: "建立该流程的质量门槛和异常回滚机制，确保效率提升不以质量下滑为代价。",
      d90: "将流程模板复制到第二个场景，并形成跨团队的人机协作标准。"
    },
    R2: {
      d30: "明确接下来一个月的方向假设与关键里程碑，并向团队透明说明不确定性边界。",
      d60: "建立双周方向校准机制，确保目标变化时团队心理预期和资源安排同步更新。",
      d90: "沉淀“方向决策记录卡”，提升组织在变化中的一致性与稳定性。"
    },
    R3: {
      d30: "补齐预警指标（质量、时效、风险）并定义触发阈值与责任人。",
      d60: "完成至少两次问题闭环复盘，形成“发现-处置-复发预防”的标准流程。",
      d90: "搭建跨角色责任协作机制，让关键风险从个人兜底升级为体系兜底。"
    },
    R4: {
      d30: "明确本季度最稀缺的三类资源，并对齐资源分配优先级。",
      d60: "建立外部专家/算力/预算的快速调配通道，缩短关键项目等待时间。",
      d90: "形成可复用的资源编排策略库，支持不同业务场景快速调用。"
    },
    R5: {
      d30: "输出团队能力地图，标注“当前能力、缺口能力、替补方案”。",
      d60: "围绕关键缺口执行“外借+内部培养”双轨计划并跟踪效果。",
      d90: "将能力更新节奏制度化，做到按业务变化动态刷新。"
    },
    C1: {
      d30: "选择2-3个高价值AI工具，统一提示词与评测标准。",
      d60: "在团队中推动工具SOP落地，减少个人经验差导致的产出波动。",
      d90: "建立工具复盘机制，持续优化使用策略和质量控制。"
    },
    C2: {
      d30: "选一个低风险高频场景做深度落地，定义业务价值指标。",
      d60: "复盘场景ROI并将有效做法复制到第二个业务场景。",
      d90: "形成“场景识别-试点-扩展”标准路径，提升落地成功率。"
    },
    C3: {
      d30: "针对一项复杂问题，先写清问题框定、关键假设和验证标准。",
      d60: "用小步实验验证关键假设，避免一次性大投入带来的决策风险。",
      d90: "沉淀你的复杂问题拆解模板，并带团队共创至少一次。"
    },
    C4: {
      d30: "为自己和团队建立压力预警信号，提前识别失衡状态。",
      d60: "引入固定节律的复盘与情绪整理，减少高压下的决策偏差。",
      d90: "形成可复制的“压力管理与恢复机制”，增强团队持续战斗力。"
    },
    C5: {
      d30: "在冲突场景中固定使用“复述诉求-确认共同目标-对齐行动”三步法。",
      d60: "建立跨角色沟通规则，减少信息误读和情绪化对抗。",
      d90: "沉淀高质量沟通案例，提升团队协作氛围与心理安全。"
    }
  };
  const plan = actions[id];
  if (!plan) {
    return "30天：选一个核心场景完成复盘。\n  60天：建立可追踪改进机制。\n  90天：形成可复制的方法并推广。";
  }
  if (improve) {
    return `30天：${plan.d30}\n  60天：${plan.d60}\n  90天：${plan.d90}`;
  }
  return `30天：在现有基础上把经验模板化并共享。\n  60天：扩大应用范围并纳入团队机制。\n  90天：沉淀为组织级最佳实践。`;
}

function buildDimensionEvidence(answersByDimension, dimensionId) {
  const items = answersByDimension[dimensionId] || [];
  const textAnswers = items
    .filter((x) => x.question.type === "text" && x.answer?.text)
    .map((x) => x.answer.text.trim())
    .filter(Boolean);
  if (!textAnswers.length) {
    const choice = items.find((x) => x.question.type === "choice");
    if (!choice) return "当前维度证据较少，建议后续补充真实案例。";
    const selected =
      choice.question.options.find((opt) => opt.id === choice.answer?.choiceId)?.label ||
      "已完成情景选择";
    return `该维度主要基于情景选择：${selected}`;
  }
  const first = textAnswers[0];
  return first.length > 80 ? `${first.slice(0, 80)}...` : first;
}

function makeRuleBasedNarrative(
  profile,
  overall,
  dimensionDetails,
  answers,
  introProfile = {}
) {
  const sorted = Object.entries(profile).sort((a, b) => b[1] - a[1]);
  const strengths = sorted.slice(0, 2).map(([k]) => DIMENSIONS[k].name);
  const gaps = [...sorted].reverse().slice(0, 2).map(([k]) => DIMENSIONS[k].name);
  const answersByDimension = {};
  answers.forEach((item) => {
    const key = item.question?.targetDimension;
    if (!key) return;
    if (!answersByDimension[key]) answersByDimension[key] = [];
    answersByDimension[key].push(item);
  });

  const contextLine = [
    introProfile.currentResponsibilities,
    introProfile.businessContext
  ]
    .filter(Boolean)
    .join("；");
  const summary = `综合评分 ${overall}/5。整体来看，你在 ${strengths.join(
    "、"
  )} 上形成了清晰优势，说明你具备把战略、机制和执行打通的能力；同时在 ${gaps.join(
    "、"
  )} 仍有提升空间。你的回答中能看到方法意识与复盘习惯，这为持续成长打下了很好的基础。${
    contextLine ? `结合你当前背景（${contextLine}），以下建议会更聚焦在可落地动作。` : ""
  }`;

  const dimensionSections = dimensionDetails
    .map((item) => {
      const band = getScoreBand(item.score);
      const groupLabel = item.group === "role" ? "角色" : "能力";
      const evidence = buildDimensionEvidence(answersByDimension, item.id);
      const suggestion = getDimensionSuggestion(item.id, item.score);
      const actionPlan = getDimensionActionPlan(item.id, item.score);
      const insight =
        band === "卓越" || band === "稳健"
          ? "你已经形成了较稳定的方法雏形，下一步重点是规模化与机制化。"
          : "当前能力仍偏阶段性，建议通过更系统的实践与复盘，提升稳定性。";
      return `- ${item.id} ${item.name}（${groupLabel}，${item.score}/5，${band}）\n  观察：${insight}\n  事实依据：${evidence}\n  深层判断：${suggestion}\n  下一步动作：\n  ${actionPlan}`;
    })
    .join("\n");

  const suggestions = [
    "30天：选择1个核心业务流程，输出“现状流程图-人机分工图-风险点-指标看板”，每周复盘一次。",
    "60天：围绕短板维度设计两次情景演练（含冲突/风险/资源约束），并用统一标准复盘行为与结果。",
    "90天：沉淀你的领导力操作手册（决策模板、协同机制、AI工具SOP），在团队内做两轮推广并跟踪效果。"
  ];

  const fullText = [
    "【AI领导力综合评价】",
    summary,
    "",
    "【10维度细致评价】",
    dimensionSections,
    "",
    "【10维行动路线图】",
    `30天：${suggestions[0]}`,
    `60天：${suggestions[1]}`,
    `90天：${suggestions[2]}`
  ].join("\n");

  return { summary, suggestions, fullText };
}

async function generateNarrativeWithModel(payload) {
  const apiKey = process.env.OPENAI_API_KEY || process.env.DEEPSEEK_API_KEY;
  if (!apiKey) return null;

  const baseUrl = process.env.OPENAI_BASE_URL || "https://api.deepseek.com";
  const model = process.env.OPENAI_MODEL || "deepseek-chat";

  const prompt = `
你是资深组织发展顾问与领导力教练。请基于评估数据生成“中肯、鼓励、客观、有温度”的中文反馈，语言要温和礼貌、专业共情。

输出要求：
1) 先给一段综合评价（180-260字），先肯定投入，再指出关键成长方向。
2) 然后按10个维度逐条给出：
   - 维度结论（当前水平）
   - 事实依据（引用回答要点）
   - 深层判断（行为模式/能力机制）
   - 下一步动作（该维度30天/60天/90天）
3) 保持鼓励但不空泛，避免模板化套话。
4) 结尾补一句温暖、务实的鼓励。

被评估人背景：
${JSON.stringify(payload.introProfile || {}, null, 2)}

维度分数（10维）：
${JSON.stringify(payload.dimensionDetails, null, 2)}

总分：${payload.overall}

回答摘要（用于事实依据）：
${JSON.stringify(payload.answerSnapshots, null, 2)}
`.trim();

  const response = await fetch(`${baseUrl}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model,
      temperature: 0.5,
      messages: [
        {
          role: "system",
          content:
            "你是温和、客观且有洞见的AI领导力教练。反馈要有事实依据和可执行建议。"
        },
        { role: "user", content: prompt }
      ]
    })
  });

  if (!response.ok) {
    throw new Error(`Model API error: ${response.status}`);
  }

  const data = await response.json();
  const content = data.choices?.[0]?.message?.content || "";
  return content.trim();
}

app.post("/api/start", (req, res) => {
  const { userName = "匿名用户", userRole = "未填写", introProfile = {} } = req.body || {};
  const sessionId = uid();
  const questionSet = buildSessionQuestionSet();
  const cleanedIntroProfile = {
    currentResponsibilities: (introProfile.currentResponsibilities || "").trim(),
    teamSize: (introProfile.teamSize || "").trim(),
    businessContext: (introProfile.businessContext || "").trim(),
    assessmentGoal: (introProfile.assessmentGoal || "").trim()
  };
  sessions.set(sessionId, {
    userName,
    userRole,
    introProfile: cleanedIntroProfile,
    currentIndex: 0,
    questionSet,
    answers: [],
    startedAt: Date.now()
  });
  res.json({
    sessionId,
    openingMessage: buildWarmOpeningMessage(userName, userRole, cleanedIntroProfile),
    question: formatQuestionForConversation(questionSet[0], 1, questionSet.length),
    progress: { current: 1, total: questionSet.length }
  });
});

app.post("/api/answer", (req, res) => {
  const { sessionId, answer } = req.body || {};
  const session = sessions.get(sessionId);
  if (!session) {
    return res.status(404).json({ error: "会话不存在，请重新开始。" });
  }

  const currentQuestion = session.questionSet[session.currentIndex];
  if (!currentQuestion) {
    return res.status(400).json({ error: "题目已完成，请直接生成报告。" });
  }

  session.answers.push({
    question: currentQuestion,
    answer
  });
  session.currentIndex += 1;
  sessions.set(sessionId, session);

  const done = session.currentIndex >= session.questionSet.length;
  if (done) {
    return res.json({
      done: true,
      message: "非常感谢你的认真作答，评估已完成。接下来我将为你生成详细报告。"
    });
  }

  const next = session.questionSet[session.currentIndex];
  return res.json({
    done: false,
    question: formatQuestionForConversation(
      next,
      session.currentIndex + 1,
      session.questionSet.length
    ),
    progress: { current: session.currentIndex + 1, total: session.questionSet.length }
  });
});

app.post("/api/report", async (req, res) => {
  const { sessionId } = req.body || {};
  const session = sessions.get(sessionId);
  if (!session) {
    return res.status(404).json({ error: "会话不存在，请重新开始。" });
  }

  const dimensionScores = computeDimensionScores(session.answers);
  const overall = computeOverallScore(dimensionScores);
  const { roleRadar, capabilityRadar } = buildRadarData(dimensionScores);
  const dimensionDetails = Object.entries(dimensionScores).map(([id, score]) => ({
    id,
    name: DIMENSIONS[id].name,
    score,
    weight: DIMENSIONS[id].weight,
    group: DIMENSIONS[id].group
  }));

  const answerSnapshots = session.answers.map((item) => ({
    dimension: item.question?.targetDimension,
    type: item.question?.type,
    prompt: item.question?.prompt?.slice(0, 60),
    answer:
      item.question?.type === "choice"
        ? item.question?.options?.find((opt) => opt.id === item.answer?.choiceId)?.label ||
          `choiceIndex:${item.answer?.choiceIndex}`
        : (item.answer?.text || "").slice(0, 120)
  }));

  let modelNarrative = null;
  try {
    modelNarrative = await generateNarrativeWithModel({
      dimensionScores,
      dimensionDetails,
      overall,
      introProfile: session.introProfile,
      answers: session.answers,
      answerSnapshots
    });
  } catch (err) {
    modelNarrative = null;
  }

  const fallback = makeRuleBasedNarrative(
    dimensionScores,
    overall,
    dimensionDetails,
    session.answers,
    session.introProfile
  );

  res.json({
    user: {
      name: session.userName,
      role: session.userRole,
      introProfile: session.introProfile
    },
    scores: {
      overall,
      dimensions: dimensionDetails
    },
    radar: {
      roleRadar,
      capabilityRadar
    },
    meta: {
      dimensionDefinitions: Object.entries(DIMENSIONS).map(([id, item]) => ({
        id,
        name: item.name,
        group: item.group,
        weight: item.weight
      }))
    },
    narrative: {
      aiGenerated: modelNarrative || fallback.fullText,
      summary: fallback.summary,
      suggestions: fallback.suggestions
    }
  });
});

app.get("/api/health", (req, res) => {
  res.json({ ok: true });
});

function startServer(preferredPort, maxRetries = 10) {
  let port = Number(preferredPort) || 3000;
  let attempts = 0;

  const launch = () => {
    const server = app.listen(port, () => {
      console.log(`AI leadership app running at http://localhost:${port}`);
    });

    server.on("error", (err) => {
      if (err.code === "EADDRINUSE" && attempts < maxRetries) {
        attempts += 1;
        port += 1;
        console.warn(
          `Port in use, retrying on http://localhost:${port} (attempt ${attempts}/${maxRetries})`
        );
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
