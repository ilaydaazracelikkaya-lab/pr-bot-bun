import { test, expect, beforeEach, mock } from "bun:test";
import request from "supertest";
import app from "../src/index.js";

let logs = [];

beforeEach(() => {
  logs = [];
  console.log = mock(() => {});
  console.error = mock(() => {});
  console.log.mockImplementation((msg) => logs.push(String(msg)));
  console.error.mockImplementation((msg) => logs.push(String(msg)));
});

test("Generates AI summary when Gemini API succeeds", async () => {
  global.fetch = mock(async () => ({
    json: async () => ({
      candidates: [
        { content: { parts: [{ text: "AI generated summary" }] } },
      ],
    }),
  }));

  const res = await request(app)
    .post("/webhook")
    .set("x-github-event", "pull_request")
    .send({
      action: "opened",
      pull_request: { title: "Add new feature", issue_url: "https://example.com" },
      repository: { full_name: "azra/pr-bot" },
    });

  expect(res.status).toBe(200);
  expect(logs.some((m) => m.includes("PR description updated"))).toBe(true);
});

test("Logs error when Gemini API request fails", async () => {
  global.fetch = mock(async () => {
    throw new Error("Network failure");
  });

  const res = await request(app)
    .post("/webhook")
    .set("x-github-event", "pull_request")
    .send({
      action: "opened",
      pull_request: { title: "Failing PR", issue_url: "https://example.com" },
      repository: { full_name: "azra/pr-bot" },
    });

  expect(res.status).toBe(200);
  expect(logs.some((m) => m.includes("Gemini API request failed"))).toBe(true);
});
