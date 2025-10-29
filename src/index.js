import express from "express";
import dotenv from "dotenv";
dotenv.config();

const app = express();
app.use(express.json({ limit: "1mb" }));

// 🔹 Hugging Face API bilgileri
// Burada modeli ve anahtarı .env dosyasından alıyoruz
const HF_API = "https://api-inference.huggingface.co/models/gpt2"; // ücretsiz küçük model
const HF_KEY = process.env.HUGGINGFACE_API_KEY;

// ✅ Test endpoint'i
app.get("/webhook", (req, res) => {
  res.send("✅ Webhook endpoint aktif — Hugging Face modunda!");
});

// 🔹 PR Webhook'u
app.post("/webhook", async (req, res) => {
  const event = req.headers["x-github-event"];
  console.log("📩 GITHUB EVENT:", event);

  if (event === "ping") {
    console.log("✅ Webhook bağlantısı doğrulandı!");
  } 
  else if (event === "pull_request") {
    const action = req.body.action;
    const pr = req.body.pull_request;
    const repo = req.body.repository.full_name;

    console.log(`🔧 Pull Request ${action}: "${pr.title}"`);

    // PR açıldığında ya da güncellendiğinde açıklama üret
    if (action === "opened" || action === "synchronize") {
      const prompt = `Write a short, clear English description for a pull request titled "${pr.title}" in the repository "${repo}". 
      It changed ${pr.changed_files} files, added ${pr.additions} lines, and deleted ${pr.deletions} lines.`;

      try {
        // Hugging Face'e istek gönder
        const response = await fetch(HF_API, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${HF_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ inputs: prompt }),
        });

        const data = await response.json();
        const summary = data?.[0]?.generated_text || "AI could not generate description.";

        // PR açıklamasını GitHub API ile güncelle
        const update = await fetch(pr.url, {
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
