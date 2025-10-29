import express from "express";
import dotenv from "dotenv";
import fetch from "node-fetch";
import OpenAI from "openai";

dotenv.config();

const app = express();
app.use(express.json({ limit: "1mb" }));

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

app.get("/webhook", (req, res) => {
  res.send("✅ Webhook endpoint is active! Waiting for POST requests from GitHub.");
});

app.post("/webhook", async (req, res) => {
  const event = req.headers["x-github-event"];
  console.log("📩 GITHUB EVENT:", event);

  if (event === "ping") {
    console.log("✅ Webhook connection verified!");
  } else if (event === "pull_request") {
    const action = req.body.action;
    const pr = req.body.pull_request;
    const repo = req.body.repository.full_name;

    if (action === "opened" || action === "synchronize") {
      const diffInfo = `
        Repo: ${repo}
        PR Title: ${pr.title}
        Changed Files: ${pr.changed_files}
        Additions: ${pr.additions}
        Deletions: ${pr.deletions}
      `;

      console.log("🧠 Generating AI-based PR description...");

      const completion = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: "You are a helpful assistant that writes professional GitHub PR descriptions." },
          { role: "user", content: `Generate a concise pull request description for the following details:\n${diffInfo}` },
        ],
      });

      const aiDescription = completion.choices[0].message.content;

      const response = await fetch(pr.url, {
        method: "PATCH",
        headers: {
          "Authorization": `Bearer ${process.env.GITHUB_TOKEN}`,
          "Accept": "application/vnd.github+json",
        },
        body: JSON.stringify({ body: aiDescription }),
      });

      console.log("✨ PR description updated via AI:", response.status);
    }
  }

  res.status(200).send("ok");
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Bun server running on port ${PORT}`));
