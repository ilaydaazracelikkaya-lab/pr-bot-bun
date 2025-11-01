import express from "express";
import dotenv from "dotenv";
dotenv.config();

const app = express();
app.use(express.json({ limit: "1mb" }));

const GEMINI_KEY = process.env.GEMINI_API_KEY;
let processing = false;

app.post("/webhook", async (req, res) => {
  // 🔍 DEBUG LOGS
  console.log("📩 Incoming webhook request");
  console.log("📦 FULL HEADERS:", req.headers);
  console.log("📦 FULL BODY:", req.body);

  const event = req.headers["x-github-event"];
  console.log("🔍 Extracted event:", event);

  // her durumda hemen yanıt verelim
  res.status(200).send("Received!");

  // 🔹 Ping olayı: bağlantı doğrulama
  if (event === "ping") {
    console.log("✅ Webhook connection verified!");
    return;
  }

  // 🔹 Pull request olayı
  if (event === "pull_request") {
    if (processing) {
      console.log("⚠️ Another PR is being processed, skipping concurrent request.");
      return;
    }

    processing = true;

    try {
      const action = req.body.action;
      const pr = req.body.pull_request;
      const repo = req.body.repository.full_name;

      console.log("🪄 Pull request action:", action);

      if (pr.body && pr.body.includes("<!-- AI updated -->")) {
        console.log("ℹ️ Already updated by AI — skipping...");
        return;
      }

      // 🔸 PR değişiklik yoksa
      if (["synchronize", "edited"].includes(action) && pr.changed_files === 0) {
        console.log("ℹ️ No code changes detected, skipping description update.");
        return;
      }

      if (["opened", "synchronize", "edited", "ready_for_review"].includes(action)) {
        const prompt = `
        Write a short, clear, and professional English description for a GitHub Pull Request titled "${pr.title}" 
        in the repository "${repo}". Mention what it changes or improves in 1–2 sentences.
        `;

        let summary;

        try {
          console.log("🤖 Sending request to Gemini API...");
          const response = await fetch(
            `https://generativelanguage.googleapis.com/v1/models/gemini-2.5-flash:generateContent?key=${GEMINI_KEY}`,
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                contents: [{ parts: [{ text: prompt }] }],
              }),
            }
          );

          const data = await response.json();
          summary =
            (data?.candidates?.[0]?.content?.parts?.[0]?.text ||
              "AI could not generate a description.") +
            "\n\n<!-- AI updated -->";
        } catch (apiError) {
          console.error("❌ Gemini API request failed:", apiError);
          summary =
            "AI service unavailable. Please provide a manual PR description.\n\n<!-- AI updated -->";
        }

        console.log("📝 PR description to update:\n", summary);

        try {
          const update = await fetch(pr.issue_url, {
            method: "PATCH",
            headers: {
              Authorization: `Bearer ${process.env.GITHUB_TOKEN}`,
              Accept: "application/vnd.github+json",
            },
            body: JSON.stringify({ body: summary }),
          });
          console.log(`✅ PR description updated! [${update.status}]`);
        } catch (updateError) {
          console.error("❌ Failed to update PR:", updateError);
        }
      }
    } finally {
      processing = false;
    }
  }
});

const PORT = process.env.PORT || 3000;
if (import.meta.main) {
  app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
}

export default app;
