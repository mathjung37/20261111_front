import { createDemoApi, createHttpApi, normalizeTasks } from "./api.js";

const config = window.APP_CONFIG ?? { API_BASE_URL: "http://localhost:8000", DEMO_MODE: true };
const api = config.DEMO_MODE ? createDemoApi() : createHttpApi(config.API_BASE_URL);

const elements = {
  activePlanner: document.querySelector("#active-planner"),
  addPlanItem: document.querySelector("#add-plan-item"),
  chatForm: document.querySelector("#chat-form"),
  chatLog: document.querySelector("#chat-log"),
  chatMessage: document.querySelector("#chat-message"),
  closeDialog: document.querySelector("#close-dialog"),
  completedCount: document.querySelector("#completed-count"),
  completedWork: document.querySelector("#completed-work"),
  emptyState: document.querySelector("#empty-state"),
  finalizePlan: document.querySelector("#finalize-plan"),
  formError: document.querySelector("#form-error"),
  planList: document.querySelector("#plan-list"),
  plannerError: document.querySelector("#planner-error"),
  planSummary: document.querySelector("#plan-summary"),
  resetSession: document.querySelector("#reset-session"),
  sendMessage: document.querySelector("#send-message"),
  submitWork: document.querySelector("#submit-work"),
  successCopy: document.querySelector("#success-copy"),
  successDialog: document.querySelector("#success-dialog"),
  todayLabel: document.querySelector("#today-label"),
  toast: document.querySelector("#toast"),
  upcomingCount: document.querySelector("#upcoming-count"),
  upcomingWork: document.querySelector("#upcoming-work"),
  workForm: document.querySelector("#work-form")
};

const state = { sessionId: null, plan: [], messages: [] };

function formatDate() {
  return new Intl.DateTimeFormat("ko-KR", {
    month: "long",
    day: "numeric",
    weekday: "short"
  }).format(new Date());
}

function setBusy(button, isBusy, busyText) {
  if (!button.dataset.label) button.dataset.label = button.querySelector("span")?.textContent ?? button.textContent;
  button.disabled = isBusy;
  const label = button.querySelector("span");
  if (label) label.textContent = isBusy ? busyText : button.dataset.label;
}

function showError(element, message) {
  element.textContent = message;
  element.hidden = !message;
}

function showToast(message) {
  elements.toast.textContent = message;
  elements.toast.hidden = false;
  clearTimeout(showToast.timer);
  showToast.timer = setTimeout(() => { elements.toast.hidden = true; }, 2600);
}

function updateCounts() {
  elements.completedCount.textContent = `${normalizeTasks(elements.completedWork.value).length}개`;
  elements.upcomingCount.textContent = `${normalizeTasks(elements.upcomingWork.value).length}개`;
  localStorage.setItem("tomorrow-desk-draft", JSON.stringify({
    completed: elements.completedWork.value,
    upcoming: elements.upcomingWork.value
  }));
}

function appendMessage(role, content) {
  state.messages.push({ role, content });
  const item = document.createElement("article");
  item.className = `message message-${role}`;
  const name = document.createElement("span");
  name.textContent = role === "assistant" ? "계획 파트너" : "나";
  const body = document.createElement("p");
  body.textContent = content;
  item.append(name, body);
  elements.chatLog.append(item);
  elements.chatLog.scrollTop = elements.chatLog.scrollHeight;
}

function renderPlan() {
  elements.planList.replaceChildren();
  state.plan.forEach((task, index) => {
    const row = document.createElement("div");
    row.className = "plan-row";
    row.dataset.id = task.id;

    const order = document.createElement("span");
    order.className = "plan-order";
    order.textContent = String(index + 1).padStart(2, "0");

    const input = document.createElement("input");
    input.type = "text";
    input.value = task.title;
    input.setAttribute("aria-label", `${index + 1}번째 할 일`);
    input.addEventListener("input", () => {
      task.title = input.value;
      updatePlanSummary();
    });

    const remove = document.createElement("button");
    remove.type = "button";
    remove.className = "remove-plan";
    remove.setAttribute("aria-label", `${task.title || "할 일"} 삭제`);
    remove.textContent = "×";
    remove.addEventListener("click", () => {
      state.plan = state.plan.filter((item) => item.id !== task.id);
      renderPlan();
    });

    row.append(order, input, remove);
    elements.planList.append(row);
  });
  updatePlanSummary();
}

function updatePlanSummary() {
  const count = state.plan.filter((task) => task.title.trim()).length;
  elements.planSummary.textContent = `${count}개의 할 일`;
  elements.finalizePlan.disabled = count === 0;
}

function openPlanner() {
  elements.emptyState.hidden = true;
  elements.activePlanner.hidden = false;
  elements.activePlanner.scrollIntoView({ behavior: "smooth", block: "start" });
}

function resetSession() {
  state.sessionId = null;
  state.plan = [];
  state.messages = [];
  elements.chatLog.replaceChildren();
  elements.planList.replaceChildren();
  elements.activePlanner.hidden = true;
  elements.emptyState.hidden = false;
  showError(elements.formError, "");
  showError(elements.plannerError, "");
  elements.completedWork.focus();
}

elements.workForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  const completedTasks = normalizeTasks(elements.completedWork.value);
  const upcomingTasks = normalizeTasks(elements.upcomingWork.value);

  if (!completedTasks.length && !upcomingTasks.length) {
    showError(elements.formError, "오늘 한 업무나 앞으로 할 업무를 한 가지 이상 적어주세요.");
    elements.completedWork.focus();
    return;
  }

  showError(elements.formError, "");
  setBusy(elements.submitWork, true, "계획을 준비하는 중");
  try {
    const result = await api.createSession({ completedTasks, upcomingTasks });
    state.sessionId = result.sessionId;
    state.plan = result.plan ?? [];
    openPlanner();
    appendMessage("assistant", result.assistantMessage);
    renderPlan();
    localStorage.removeItem("tomorrow-desk-draft");
  } catch (error) {
    showError(elements.formError, `${error.message} 잠시 후 다시 시도해 주세요.`);
  } finally {
    setBusy(elements.submitWork, false, "");
  }
});

elements.chatForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  const message = elements.chatMessage.value.trim();
  if (!message || !state.sessionId) return;

  appendMessage("user", message);
  elements.chatMessage.value = "";
  elements.sendMessage.disabled = true;
  showError(elements.plannerError, "");
  try {
    const result = await api.sendMessage(state.sessionId, message, state.plan);
    appendMessage("assistant", result.assistantMessage);
    if (result.plan) {
      state.plan = result.plan;
      renderPlan();
    }
  } catch (error) {
    showError(elements.plannerError, `${error.message} 메시지는 화면에 남아 있습니다.`);
  } finally {
    elements.sendMessage.disabled = false;
    elements.chatMessage.focus();
  }
});

elements.addPlanItem.addEventListener("click", () => {
  state.plan.push({ id: `manual-${Date.now()}`, title: "", completed: false });
  renderPlan();
  elements.planList.lastElementChild?.querySelector("input")?.focus();
});

elements.finalizePlan.addEventListener("click", async () => {
  const finalPlan = state.plan
    .map((task) => ({ ...task, title: task.title.trim() }))
    .filter((task) => task.title);
  if (!state.sessionId || !finalPlan.length) return;

  showError(elements.plannerError, "");
  setBusy(elements.finalizePlan, true, "계획을 저장하는 중");
  try {
    await api.finalizeSession(state.sessionId, finalPlan);
    elements.successCopy.textContent = `${finalPlan.length}개의 할 일을 내일의 목록으로 저장했습니다.`;
    elements.successDialog.showModal();
  } catch (error) {
    showError(elements.plannerError, `${error.message} 계획을 확인한 뒤 다시 저장해 주세요.`);
  } finally {
    setBusy(elements.finalizePlan, false, "");
  }
});

elements.completedWork.addEventListener("input", updateCounts);
elements.upcomingWork.addEventListener("input", updateCounts);
elements.resetSession.addEventListener("click", resetSession);
elements.closeDialog.addEventListener("click", () => elements.successDialog.close());
elements.chatMessage.addEventListener("keydown", (event) => {
  if (event.key === "Enter" && !event.shiftKey) {
    event.preventDefault();
    elements.chatForm.requestSubmit();
  }
});

elements.todayLabel.textContent = formatDate();
const savedDraft = JSON.parse(localStorage.getItem("tomorrow-desk-draft") || "null");
if (savedDraft) {
  elements.completedWork.value = savedDraft.completed ?? "";
  elements.upcomingWork.value = savedDraft.upcoming ?? "";
  showToast("작성 중이던 업무를 불러왔습니다.");
}
updateCounts();
