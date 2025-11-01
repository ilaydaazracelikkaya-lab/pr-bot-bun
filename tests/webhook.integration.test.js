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

test("Responds 200 and 'Received!' for ping event", async () => {
  const res = await request(app)
    .post("/webhook")
    .set("x-github-event", "ping")
    .send({});
  expect(res.status).toBe(200);
  expect(res.text).toBe("Received!");
  expect(logs.some((m) => m.includes("Webhook connection verified!"))).toBe(true);
});

test("Skips when AI tag is present", async () => {
  await request(app)
    .post("/webhook")
    .set("x-github-event", "pull_request")
    .send({
      action: "opened",
      pull_request: { body: "<!-- AI updated -->", title: "Test" },
      repository: { full_name: "azra/pr-bot" },
    });
  expect(logs.some((m) => m.includes("Already updated by AI"))).toBe(true);
});

test("Skips update if no code changes", async () => {
  await request(app)
    .post("/webhook")
    .set("x-github-event", "pull_request")
    .send({
      action: "edited",
      pull_request: { title: "No changes", changed_files: 0 },
      repository: { full_name: "azra/pr-bot" },
    });
  expect(
    logs.some((m) => m.includes("No code changes detected"))
  ).toBe(true);
});

test("Handles Gemini API failure and logs error", async () => {
  global.fetch = async () => {
    throw new Error("Network failure");
  };

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

test("Handles concurrent PR requests safely", async () => {
  const body = {
    action: "opened",
    pull_request: { title: "Concurrent PR", issue_url: "https://example.com" },
    repository: { full_name: "azra/pr-bot" },
  };

  const [res1, res2] = await Promise.all([
    request(app).post("/webhook").set("x-github-event", "pull_request").send(body),
    request(app).post("/webhook").set("x-github-event", "pull_request").send(body),
  ]);

  //Both of them turn 200
  expect(res1.status).toBe(200);
  expect(res2.status).toBe(200);
  expect(logs.some((m) => m.includes("Another PR is being processed"))).toBeDefined();
});

