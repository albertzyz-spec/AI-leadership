// ─── i18n ────────────────────────────────────────────────────────────────────

const I18N = {
  zh: {
    title: "AI Leadership 自测",
    labelName: "姓名",
    placeholderName: "例如：张三",
    labelRole: "当前角色",
    placeholderRole: "例如：产品负责人",
    startBtn: "开始对话评估",
    answerPlaceholder: "请输入你的回答...",
    sendBtn: "发送",
    reportTitle: "评估报告",
    downloadPdf: "下载 PDF",
    roleRadarTitle: "角色维度雷达",
    capRadarTitle: "能力维度雷达",
    scoresTitle: "各维度评分",
    colDimension: "维度",
    colGroup: "类型",
    colScore: "分数",
    colLevel: "等级",
    reportNarrativeTitle: "AI领导力评价与发展建议",
    groupRole: "角色",
    groupCapability: "能力",
    progressText: (turn, covered) => `第 ${turn} 轮 · 已覆盖 ${covered}/10 维度`,
    thinking: "让我想想我该说什么",
    startError: "启动失败：",
    sendError: "抱歉，发送失败：",
    reportLoading: "正在生成报告，请稍候（R1深度思考中）...",
    overallScore: (s) => `综合得分：${s} / 5`,
    userInfoLine: (name, role) => `评估对象：${name} · ${role}`,
    levelNames: { L1: "L1 待强化", L2: "L2 初步具备", L3: "L3 发展中", L4: "L4 稳健", L5: "L5 卓越" },
    pdfFilename: (name) => `AI领导力报告_${name}_${today()}.pdf`
  },
  en: {
    title: "AI Leadership Self-Assessment",
    labelName: "Name",
    placeholderName: "e.g. John Smith",
    labelRole: "Current Role",
    placeholderRole: "e.g. Product Lead",
    startBtn: "Start Assessment",
    answerPlaceholder: "Type your answer here...",
    sendBtn: "Send",
    reportTitle: "Assessment Report",
    downloadPdf: "Download PDF",
    roleRadarTitle: "Role Dimensions Radar",
    capRadarTitle: "Capability Dimensions Radar",
    scoresTitle: "Dimension Scores",
    colDimension: "Dimension",
    colGroup: "Type",
    colScore: "Score",
    colLevel: "Level",
    reportNarrativeTitle: "AI Leadership Evaluation & Development Plan",
    groupRole: "Role",
    groupCapability: "Capability",
    progressText: (turn, covered) => `Turn ${turn} · ${covered}/10 dimensions covered`,
    thinking: "Let me think about what to ask...",
    startError: "Failed to start: ",
    sendError: "Sorry, failed to send: ",
    reportLoading: "Generating your report, please wait (R1 deep reasoning in progress)...",
    overallScore: (s) => `Overall Score: ${s} / 5`,
    userInfoLine: (name, role) => `Assessed: ${name} · ${role}`,
    levelNames: { L1: "L1 Needs Work", L2: "L2 Beginning", L3: "L3 Developing", L4: "L4 Proficient", L5: "L5 Excellent" },
    pdfFilename: (name) => `AI-Leadership-Report_${name}_${today()}.pdf`
  }
};

function today() {
  return new Date().toISOString().slice(0, 10);
}

// ─── State ────────────────────────────────────────────────────────────────────

let lang = localStorage.getItem("lang") || "zh";
let sessionId = null;
let roleChart = null;
let capChart = null;

// ─── DOM refs ─────────────────────────────────────────────────────────────────

const startPanel      = document.getElementById("startPanel");
const chatPanel       = document.getElementById("chatPanel");
const reportPanel     = document.getElementById("reportPanel");
const chatWindow      = document.getElementById("chatWindow");
const progressText    = document.getElementById("progressText");
const answerInput     = document.getElementById("answerInput");
const sendBtn         = document.getElementById("sendBtn");
const inputArea       = document.getElementById("inputArea");
const langToggle      = document.getElementById("langToggle");
const overallScore    = document.getElementById("overallScore");
const scoreTableBody  = document.getElementById("scoreTableBody");
const narrativeText   = document.getElementById("narrativeText");
const userInfo        = document.getElementById("userInfo");
const downloadPdfBtn  = document.getElementById("downloadPdfBtn");

// ─── i18n helpers ─────────────────────────────────────────────────────────────

function t(key) {
  return I18N[lang][key] || key;
}

function applyI18n() {
  document.documentElement.lang = lang === "zh" ? "zh-CN" : "en";
  langToggle.textContent = lang === "zh" ? "EN" : "中";

  document.querySelectorAll("[data-i18n]").forEach(el => {
    const key = el.getAttribute("data-i18n");
    if (I18N[lang][key]) el.textContent = I18N[lang][key];
  });
  document.querySelectorAll("[data-i18n-placeholder]").forEach(el => {
    const key = el.getAttribute("data-i18n-placeholder");
    if (I18N[lang][key]) el.placeholder = I18N[lang][key];
  });
}

function toggleLanguage() {
  lang = lang === "zh" ? "en" : "zh";
  localStorage.setItem("lang", lang);
  applyI18n();
}

// ─── Chat helpers ─────────────────────────────────────────────────────────────

function appendMessage(role, text) {
  const div = document.createElement("div");
  div.className = `msg ${role}`;
  div.textContent = text;
  chatWindow.appendChild(div);
  chatWindow.scrollTop = chatWindow.scrollHeight;
  return div;
}

function showThinking() {
  const div = document.createElement("div");
  div.className = "msg assistant thinking-msg";
  div.id = "thinkingMsg";
  div.textContent = t("thinking");
  chatWindow.appendChild(div);
  chatWindow.scrollTop = chatWindow.scrollHeight;
}

function hideThinking() {
  const el = document.getElementById("thinkingMsg");
  if (el) el.remove();
}

function setInputDisabled(disabled) {
  answerInput.disabled = disabled;
  sendBtn.disabled = disabled;
}

function updateProgress(turn, covered) {
  progressText.textContent = I18N[lang].progressText(turn, covered);
}

// ─── API ──────────────────────────────────────────────────────────────────────

async function apiPost(url, body) {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body)
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(json.error || `HTTP ${res.status}`);
  return json;
}

// ─── Start Assessment ─────────────────────────────────────────────────────────

async function startAssessment() {
  const userName = document.getElementById("userName").value.trim() || (lang === "zh" ? "匿名用户" : "Anonymous");
  const userRole = document.getElementById("userRole").value.trim() || (lang === "zh" ? "未填写" : "Not specified");

  const data = await apiPost("/api/start", { userName, userRole, language: lang });
  sessionId = data.sessionId;

  startPanel.classList.add("hidden");
  chatPanel.classList.remove("hidden");

  appendMessage("assistant", data.openingMessage);
  updateProgress(0, 0);
}

// ─── Send Message ─────────────────────────────────────────────────────────────

async function sendMessage() {
  const text = answerInput.value.trim();
  if (!text || !sessionId) return;

  appendMessage("user", text);
  answerInput.value = "";
  setInputDisabled(true);
  showThinking();

  try {
    const data = await apiPost("/api/chat", { sessionId, message: text });
    hideThinking();

    // Show AI reply
    if (data.reply) appendMessage("assistant", data.reply);

    // Show next question (with slight visual separation if there's a reply)
    if (!data.done && data.nextQuestion) {
      appendMessage("assistant", data.nextQuestion);
    }

    updateProgress(data.progress.turn, data.progress.coveredDimensions);

    if (data.done) {
      inputArea.classList.add("hidden");
      await loadReport();
    } else {
      setInputDisabled(false);
      answerInput.focus();
    }
  } catch (err) {
    hideThinking();
    appendMessage("assistant", t("sendError") + err.message);
    setInputDisabled(false);
  }
}

// ─── Load Report ──────────────────────────────────────────────────────────────

async function loadReport() {
  appendMessage("assistant", t("reportLoading"));

  let report;
  try {
    report = await apiPost("/api/report", { sessionId });
  } catch (err) {
    appendMessage("assistant", t("sendError") + err.message);
    return;
  }

  reportPanel.classList.remove("hidden");

  userInfo.textContent = I18N[lang].userInfoLine(report.user.name, report.user.role);
  overallScore.textContent = I18N[lang].overallScore(report.scores.overall);

  // Score table
  scoreTableBody.innerHTML = "";
  report.scores.dimensions.forEach(item => {
    const groupLabel = item.group === "role" ? t("groupRole") : t("groupCapability");
    const levelLabel = I18N[lang].levelNames[item.level] || item.level;
    const tr = document.createElement("tr");
    tr.innerHTML = `<td>${item.id} · ${item.name}</td><td>${groupLabel}</td><td>${item.score}</td><td>${levelLabel}</td>`;
    scoreTableBody.appendChild(tr);
  });

  // Narrative
  narrativeText.textContent = report.report || "";

  // Radar charts
  if (roleChart) roleChart.destroy();
  if (capChart) capChart.destroy();

  roleChart = renderRadar("roleRadarChart", report.radar.roleRadar.labels, report.radar.roleRadar.values, "rgba(54, 99, 235, 1)");
  capChart  = renderRadar("capabilityRadarChart", report.radar.capabilityRadar.labels, report.radar.capabilityRadar.values, "rgba(16, 163, 74, 1)");

  reportPanel.scrollIntoView({ behavior: "smooth" });
}

function renderRadar(canvasId, labels, values, color) {
  const ctx = document.getElementById(canvasId).getContext("2d");
  return new Chart(ctx, {
    type: "radar",
    data: {
      labels,
      datasets: [{
        data: values,
        borderColor: color,
        backgroundColor: color.replace("1)", "0.15)"),
        borderWidth: 2,
        pointRadius: 3
      }]
    },
    options: {
      plugins: { legend: { display: false } },
      scales: {
        r: { min: 0, max: 5, ticks: { stepSize: 1, font: { size: 10 } }, pointLabels: { font: { size: 11 } } }
      }
    }
  });
}

// ─── PDF Download ─────────────────────────────────────────────────────────────

async function downloadPDF() {
  downloadPdfBtn.disabled = true;
  downloadPdfBtn.textContent = "...";

  try {
    const { jsPDF } = window.jspdf;
    const canvas = await html2canvas(reportPanel, { scale: 2, useCORS: true });
    const imgData = canvas.toDataURL("image/png");

    const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
    const pageW = pdf.internal.pageSize.getWidth();
    const pageH = pdf.internal.pageSize.getHeight();
    const imgW = pageW;
    const imgH = (canvas.height * imgW) / canvas.width;

    let y = 0;
    while (y < imgH) {
      if (y > 0) pdf.addPage();
      pdf.addImage(imgData, "PNG", 0, -y, imgW, imgH);
      y += pageH;
    }

    const userName = document.getElementById("userName")?.value.trim() || "user";
    pdf.save(I18N[lang].pdfFilename(userName));
  } catch (err) {
    alert("PDF生成失败: " + err.message);
  } finally {
    downloadPdfBtn.disabled = false;
    downloadPdfBtn.textContent = t("downloadPdf");
  }
}

// ─── Event Listeners ──────────────────────────────────────────────────────────

langToggle.addEventListener("click", toggleLanguage);

document.getElementById("startBtn").addEventListener("click", async () => {
  try {
    await startAssessment();
  } catch (err) {
    alert(t("startError") + err.message);
  }
});

sendBtn.addEventListener("click", sendMessage);

answerInput.addEventListener("keydown", async (e) => {
  if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
    await sendMessage();
  }
});

downloadPdfBtn.addEventListener("click", downloadPDF);

// ─── Init ─────────────────────────────────────────────────────────────────────

applyI18n();
