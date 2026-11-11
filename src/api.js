const delay = (milliseconds) => new Promise((resolve) => setTimeout(resolve, milliseconds));

export function normalizeTasks(value) {
  return value
    .split(/\r?\n/)
    .map((task) => task.trim().replace(/^[-•]\s*/, ""))
    .filter(Boolean);
}

function buildInitialPlan(upcomingTasks) {
  return upcomingTasks.slice(0, 5).map((title, index) => ({
    id: `plan-${Date.now()}-${index}`,
    title,
    completed: false
  }));
}

export function createDemoApi() {
  return {
    async createSession({ completedTasks, upcomingTasks }) {
      await delay(650);
      const plan = buildInitialPlan(upcomingTasks);
      const completedNote = completedTasks.length
        ? `오늘 ${completedTasks.length}가지 일을 진행하셨네요. `
        : "오늘 한 일도 대화 중에 더해도 좋아요. ";
      return {
        sessionId: `demo-${Date.now()}`,
        assistantMessage: `${completedNote}남은 업무를 기준으로 내일의 목록을 먼저 만들었어요. 일정이나 우선순위에서 꼭 고려할 점이 있나요?`,
        plan
      };
    },

    async sendMessage(_sessionId, message, currentPlan) {
      await delay(550);
      const mentionsMorning = /오전|아침/.test(message);
      const mentionsAfternoon = /오후|점심/.test(message);
      const timeSuggestion = mentionsMorning
        ? "오전 일정은 짧은 확인 업무 위주로 두고, 집중이 필요한 일은 뒤로 조정해 볼게요."
        : mentionsAfternoon
          ? "오후에 집중할 수 있도록 가장 중요한 업무를 목록 앞쪽에 두는 게 좋겠어요."
          : "말씀해 주신 조건을 반영해서 우선순위를 다시 살펴볼게요.";
      return {
        assistantMessage: `${timeSuggestion} 현재 ${currentPlan.length}개의 할 일이 있어요. 빼거나 더할 업무가 있으면 편하게 말씀해 주세요.`,
        plan: currentPlan
      };
    },

    async finalizeSession(_sessionId, plan) {
      await delay(500);
      return { saved: true, planCount: plan.length };
    }
  };
}

export function createHttpApi(baseUrl, fetcher = fetch) {
  const request = async (path, options) => {
    const response = await fetcher(`${baseUrl.replace(/\/$/, "")}${path}`, {
      ...options,
      headers: { "Content-Type": "application/json", ...options?.headers }
    });

    if (!response.ok) {
      throw new Error(`요청을 처리하지 못했습니다. (${response.status})`);
    }
    return response.json();
  };

  return {
    createSession(payload) {
      return request("/work-sessions", { method: "POST", body: JSON.stringify(payload) });
    },
    sendMessage(sessionId, message, plan) {
      return request(`/work-sessions/${encodeURIComponent(sessionId)}/messages`, {
        method: "POST",
        body: JSON.stringify({ message, plan })
      });
    },
    finalizeSession(sessionId, plan) {
      return request(`/work-sessions/${encodeURIComponent(sessionId)}/finalize`, {
        method: "POST",
        body: JSON.stringify({ plan })
      });
    }
  };
}
