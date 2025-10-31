import { test, expect, beforeEach, mock } from "bun:test";
import request from "supertest";
import app from "../src/index.js";

let logs = [];

beforeEach(() => {
  logs = [];
  console.log = mock(() => {});
  console.log.mockImplementation((msg) => logs.push(msg));
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

test("Handles non-PR events", async () => {
  const res = await request(app)
    .post("/webhook")
    .set("x-github-event", "issues")
    .send({});
  expect(res.status).toBe(200);
  expect(res.text).toBe("Received!");
  expect(logs.some((m) => m.includes("GITHUB EVENT"))).toBe(true);
});
