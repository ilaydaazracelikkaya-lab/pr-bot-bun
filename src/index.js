import express from "express";
import dotenv from "dotenv";
dotenv.config();

const app = express();
app.use(express.json({ limit: "1mb" }));

// Yeni ve daha sağlam model
const HF_API = "https://api-inference.huggingface.co/models/tiiuae/falcon-7b-instruct";
const HF_KEY = process.env.HUGGINGFACE_API_KEY;

// 🔹 Webhook endpoint
app.post("/webhook", async (req, res) => {
  const event = req.headers["x-github-event"];
  console.log("📩 GITHUB EVENT:", event);

  // ✅ Ping event’i yakalayıp bağlantıyı doğrula
  if (event === "ping") {
    console.log("✅ Webhook connection verified!");
    return res.status(200).send("pong");
  }

  if (event === "pull_request") {
    const action = req.body.action;
    const pr = req.body.pull_request;
    const repo = req.body.repository.full_name;

    if (action === "opened" || action === "synchronize") {
      const prompt = `Write a short English description for a pull request titled "${pr.title}" in the repository "${repo}". 
It changed ${pr.changed_files} files, added ${pr.additions} lines, and deleted ${pr.deletions} lines.`;

      try {
        const response = await fetch(HF_API, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${HF_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ inputs: prompt }),
        });

        // Hugging Face bazen JSON dışında döner, o yüzden güvenli parse:
        const text = await response.text();
        let data;
        try {
          data = JSON.parse(text);
        } catch {
          console.log("⚠️ Non-JSON response, raw text:", text.slice(0, 200));
          data = [{ generated_text: text }];
        }

        const summary = data?.[0]?.generated_text || "AI could not generate description.";

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
        console.error("❌ Hugging Face isteği başarısız:", err);
      }
    }
  }

  res.status(200).send("ok");
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
