import express from "express";
import dotenv from "dotenv";
dotenv.config();

const app = express();
app.use(express.json({ limit: "1mb" }));

const GEMINI_KEY = process.env.GEMINI_API_KEY;

// 🔹 Webhook endpoint
app.post("/webhook", async (req, res) => {
  const event = req.headers["x-github-event"];
  console.log("📩 GITHUB EVENT:", event);

  // GitHub’a anında yanıt dönelim (timeout olmasın)
  res.status(200).send("✅ Received!");

  if (event === "ping") {
    console.log("✅ Webhook connection verified!");
    return;
  }

  if (event === "pull_request") {
    const action = req.body.action;
    console.log("Pull request action:", action);

    const pr = req.body.pull_request;
    const repo = req.body.repository.full_name;

    // 🔸 Eğer açıklama zaten AI tarafından güncellendiyse, tekrar işlem yapma
    if (pr.body && pr.body.includes("<!-- AI updated -->")) {
      console.log("⚙️ Already updated by AI — skipping...");
      return;
    }

    if (["opened", "synchronize", "edited", "ready_for_review"].includes(action)) {
      const prompt = `
      Write a short, clear, and professional English description for a GitHub Pull Request titled "${pr.title}" 
      in the repository "${repo}". Mention what it changes or improves in 1–2 sentences.
      `;

      try {
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
        const summary =
          (data?.candidates?.[0]?.content?.parts?.[0]?.text ||
            "AI could not generate a description.") +
          "\n\n<!-- AI updated -->"; // 🔥 gizli etiket eklendi

        console.log("✅ AI-generated PR description:\n", summary);

        const update = await fetch(pr.issue_url, {
          method: "PATCH",
          headers: {
            "Authorization": `Bearer ${process.env.GITHUB_TOKEN}`,
            "Accept": "application/vnd.github+json",
          },
          body: JSON.stringify({ body: summary }),
        });

        console.log(`✨ PR açıklaması güncellendi! [${update.status}]`);
      } catch (err) {
        console.error("❌ Gemini isteği başarısız:", err);
      }
    }
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
