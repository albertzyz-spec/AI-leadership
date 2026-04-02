const state = {
  sessionId: null,
  currentQuestion: null
};

const startPanel = document.getElementById("startPanel");
const chatPanel = document.getElementById("chatPanel");
const reportPanel = document.getElementById("reportPanel");
const chatWindow = document.getElementById("chatWindow");
const progressText = document.getElementById("progressText");
const choiceArea = document.getElementById("choiceArea");
const textInputArea = document.getElementById("textInputArea");
const answerInput = document.getElementById("answerInput");
const sendBtn = document.getElementById("sendBtn");
const questionMeta = document.getElementById("questionMeta");
const userInfo = document.getElementById("userInfo");
const overallScore = document.getElementById("overallScore");
const scoreTableBody = document.getElementById("scoreTableBody");
const dimensionDefinitionList = document.getElementById("dimensionDefinitionList");
const narrativeText = document.getElementById("narrativeText");

let roleChart = null;
let capabilityChart = null;

function appendMessage(role, text) {
  const msg = document.createElement("div");
  msg.className = `msg ${role}`;
  msg.textContent = text;
  chatWindow.appendChild(msg);
  chatWindow.scrollTop = chatWindow.scrollHeight;
}

function updateProgress(current, total) {
  progressText.textContent = `进度：${current}/${total}`;
}

function renderQuestion(question) {
  state.currentQuestion = question;
  appendMessage("assistant", question.prompt);
  questionMeta.textContent =
    question.kind === "scenario" ? "当前题型：情景偏好题" : "当前题型：开放证据题";

  choiceArea.innerHTML = "";
  answerInput.value = "";

  if (question.type === "choice") {
    textInputArea.classList.add("hidden");
    choiceArea.classList.remove("hidden");
    question.options.forEach((option, idx) => {
      const btn = document.createElement("button");
      btn.className = "choice-btn";
      btn.textContent = option.label;
      btn.addEventListener("click", () => submitChoice(option.id, option.label, idx));
      choiceArea.appendChild(btn);
    });
  } else {
    choiceArea.classList.add("hidden");
    textInputArea.classList.remove("hidden");
    answerInput.focus();
  }
}

async function apiPost(url, body) {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body)
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || "请求失败");
  }
  return res.json();
}

async function startAssessment() {
  const userName = document.getElementById("userName").value.trim() || "匿名用户";
  const userRole = document.getElementById("userRole").value.trim() || "未填写";

  const data = await apiPost("/api/start", { userName, userRole });
  state.sessionId = data.sessionId;

  startPanel.classList.add("hidden");
  chatPanel.classList.remove("hidden");

  appendMessage("assistant", `你好，${userName}。我们开始AI领导力评估。`);
  updateProgress(data.progress.current, data.progress.total);
  renderQuestion(data.question);
}

async function submitChoice(choiceId, label, choiceIndex) {
  appendMessage("user", label);
  await submitAnswer({ choiceId, choiceIndex });
}

async function submitText() {
  const text = answerInput.value.trim();
  if (!text) return;
  appendMessage("user", text);
  answerInput.value = "";
  await submitAnswer({ text });
}

async function submitAnswer(answer) {
  try {
    const data = await apiPost("/api/answer", {
      sessionId: state.sessionId,
      answer
    });

    if (data.done) {
      appendMessage("assistant", data.message);
      choiceArea.classList.add("hidden");
      textInputArea.classList.add("hidden");
      await loadReport();
      return;
    }

    updateProgress(data.progress.current, data.progress.total);
    renderQuestion(data.question);
  } catch (err) {
    appendMessage("assistant", `提交失败：${err.message}`);
  }
}

function renderRadar(canvasId, labels, values, label, color) {
  const ctx = document.getElementById(canvasId).getContext("2d");
  return new Chart(ctx, {
    type: "radar",
    data: {
      labels,
      datasets: [
        {
          label,
          data: values,
          borderColor: color,
          backgroundColor: color.replace("1)", "0.2)"),
          borderWidth: 2,
          pointRadius: 3
        }
      ]
    },
    options: {
      scales: {
        r: {
          min: 0,
          max: 5,
          ticks: { stepSize: 1 }
        }
      }
    }
  });
}

async function loadReport() {
  const report = await apiPost("/api/report", { sessionId: state.sessionId });

  reportPanel.classList.remove("hidden");
  userInfo.textContent = `评估对象：${report.user.name} / ${report.user.role}`;
  overallScore.textContent = `综合评分：${report.scores.overall} / 5`;

  scoreTableBody.innerHTML = "";
  const dimensionList = Array.isArray(report.scores?.dimensions)
    ? report.scores.dimensions
    : [];
  const ordered = [...dimensionList].sort((a, b) => {
    const groupA = a.group || (a.id?.startsWith("R") ? "role" : "capability");
    const groupB = b.group || (b.id?.startsWith("R") ? "role" : "capability");
    if (groupA === groupB) return a.id.localeCompare(b.id);
    return groupA === "role" ? -1 : 1;
  });
  ordered.forEach((item) => {
    const groupType =
      item.group || (item.id?.startsWith("R") ? "role" : "capability");
    const groupLabel = groupType === "role" ? "角色" : "能力";
    const tr = document.createElement("tr");
    tr.innerHTML = `<td>${item.id}. ${item.name}</td><td>${groupLabel}</td><td>${item.score}</td><td>${item.weight}%</td>`;
    scoreTableBody.appendChild(tr);
  });

  dimensionDefinitionList.innerHTML = "";
  const definitionList = Array.isArray(report.meta?.dimensionDefinitions)
    ? report.meta.dimensionDefinitions
    : ordered.map((item) => ({
        id: item.id,
        name: item.name,
        group:
          item.group || (item.id?.startsWith("R") ? "role" : "capability"),
        weight: item.weight
      }));
  definitionList.forEach((item) => {
    const li = document.createElement("li");
    const groupLabel = item.group === "role" ? "角色" : "能力";
    li.textContent = `${item.id} ${item.name}（${groupLabel}，权重${item.weight}%）`;
    dimensionDefinitionList.appendChild(li);
  });

  narrativeText.textContent = report.narrative?.aiGenerated || "暂未生成评价文本";

  if (roleChart) roleChart.destroy();
  if (capabilityChart) capabilityChart.destroy();

  roleChart = renderRadar(
    "roleRadarChart",
    report.radar.roleRadar.labels,
    report.radar.roleRadar.values,
    "角色雷达",
    "rgba(54, 99, 235, 1)"
  );
  capabilityChart = renderRadar(
    "capabilityRadarChart",
    report.radar.capabilityRadar.labels,
    report.radar.capabilityRadar.values,
    "能力雷达",
    "rgba(16, 163, 74, 1)"
  );
}

document.getElementById("startBtn").addEventListener("click", async () => {
  try {
    await startAssessment();
  } catch (err) {
    alert(`启动失败：${err.message}`);
  }
});

sendBtn.addEventListener("click", submitText);
answerInput.addEventListener("keydown", async (e) => {
  if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
    await submitText();
  }
});
