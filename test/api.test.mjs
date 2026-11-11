import test from "node:test";
import assert from "node:assert/strict";
import { createHttpApi, normalizeTasks } from "../src/api.js";

test("normalizeTasks trims lines and removes empty items", () => {
  assert.deepEqual(normalizeTasks("  첫 업무  \n\n- 두 번째 업무\n• 세 번째 업무"), [
    "첫 업무",
    "두 번째 업무",
    "세 번째 업무"
  ]);
});

test("HTTP API sends a work session request", async () => {
  const calls = [];
  const fakeFetch = async (url, options) => {
    calls.push({ url, options });
    return { ok: true, json: async () => ({ sessionId: "session-1" }) };
  };
  const api = createHttpApi("https://api.example.com/", fakeFetch);
  const payload = { completedTasks: ["완료"], upcomingTasks: ["예정"] };

  await api.createSession(payload);

  assert.equal(calls[0].url, "https://api.example.com/work-sessions");
  assert.equal(calls[0].options.method, "POST");
  assert.deepEqual(JSON.parse(calls[0].options.body), payload);
});

test("HTTP API surfaces response status on failure", async () => {
  const api = createHttpApi("https://api.example.com", async () => ({ ok: false, status: 503 }));
  await assert.rejects(() => api.createSession({}), /503/);
});
