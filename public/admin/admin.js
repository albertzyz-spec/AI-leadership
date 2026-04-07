const DIMENSION_INFO = {
  R1: { name: "人机工作流重构",         nameEn: "AI-Human Workflow Reconstruction",          group: "role" },
  R2: { name: "关键资源蓄积与生态构建", nameEn: "Key Resource Accumulation & Ecosystem",      group: "role" },
  R3: { name: "战略定向与组织稳定",     nameEn: "Strategic Direction & Org Stability",        group: "role" },
  R4: { name: "人机体系监督与结果兜底", nameEn: "AI-Human System Oversight & Accountability", group: "role" },
  R5: { name: "团队能力动态更新",       nameEn: "Dynamic Team Capability Updating",           group: "role" },
  C1: { name: "人机边界理解与AI流利度", nameEn: "AI-Human Boundary Understanding & Fluency",  group: "capability" },
  C2: { name: "AI场景落地与工作流设计", nameEn: "AI Scenario Implementation & Workflow Design",group: "capability" },
  C3: { name: "乐观与韧性",             nameEn: "Optimism & Resilience",                      group: "capability" },
  C4: { name: "复杂问题解构与解决",     nameEn: "Complex Problem Decomposition & Resolution", group: "capability" },
  C5: { name: "同理心与团队激发",       nameEn: "Empathy & Team Inspiration",                 group: "capability" }
};

function getPassword() { return sessionStorage.getItem("adminPw") || ""; }
function setPassword(pw) { sessionStorage.setItem("adminPw", pw); }

async function adminFetch(url) {
  const pw = getPassword();
  const headers = {};
  if (pw) headers["x-admin-password"] = pw;
  const res = await fetch(url, { headers });
  if (res.status === 401) throw new Error("UNAUTHORIZED");
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

function scoreToLevel(s) {
  if (s >= 4.5) return "L5";
  if (s >= 3.6) return "L4";
  if (s >= 2.8) return "L3";
  if (s >= 1.9) return "L2";
  return "L1";
}

function levelLabel(l) {
  return { L5: "卓越", L4: "稳健", L3: "发展中", L2: "初步具备", L1: "待强化" }[l] || l;
}

function formatDateTime(iso) {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("zh-CN");
}
