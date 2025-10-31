import { test, expect, beforeEach, mock } from "bun:test";
import app from "../src/index.js";
import request from "supertest";

let logs = [];
let originalFetch;

beforeEach(() => {
  // Cleanup 
  if (originalFetch) global.fetch = originalFetch;
  logs = [];

  // Mock both of them -- console.log and console.error
  console.log = mock(() => {});
  console.error = mock(() => {});

  console.log.mockImplementation((msg) => logs.push(msg));
  console.error.mockImplementation((msg) => logs.push(msg));

  originalFetch = global.fetch;

  // Fake fetch (For Gemini & GitHub API)
  global.fetch = mock(async (url, options) => {
    if (url.includes("generativelanguage.googleapis.com")) {
      return {
        json: async () => ({
          candidates: [
            {
              content: { parts: [{ text: "Generated description" }] },
            },
          ],
        }),
      };
    }
    if (url.startsWith("https://example.com")) {
      return { status: 200 };
    }
    return { json: async () => ({}), status: 200 };
  });
});

test("Generates AI summary when pull_request opened", async () => {
  const res = await request(app)
    .post("/webhook")
    .set("x-github-event", "pull_request")
    .send({
      action: "opened",
      pull_request: { title: "Add new feature", issue_url: "https://example.com" },
      repository: { full_name: "azra/pr-bot" },
    });

  expect(res.status).toBe(200);
  expect(res.text).toBe("Received!");
  expect(logs.some((m) => m.includes("AI-generated PR description"))).toBe(true);
  expect(logs.some((m) => m.includes("PR description updated!"))).toBe(true);
});

test("Skips other PR actions", async () => {
  await request(app)
    .post("/webhook")
    .set("x-github-event", "pull_request")
    .send({
      action: "closed",
      pull_request: { title: "Close PR" },
      repository: { full_name: "azra/pr-bot" },
    });
  expect(logs.some((m) => m.includes("AI-generated"))).toBe(false);
});

test("Handles Gemini API error gracefully", async () => {
  global.fetch = mock(async () => {
    throw new Error("Network failure");
  });

  await request(app)
    .post("/webhook")
    .set("x-github-event", "pull_request")
    .send({
      action: "opened",
      pull_request: { title: "Broken", issue_url: "https://example.com" },
      repository: { full_name: "azra/pr-bot" },
    });
    
  expect(logs.some((m) => m.includes("The Gemini API request failed"))).toBe(true);
});
