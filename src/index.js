import express from "express";
import dotenv from "dotenv";

dotenv.config();

const app = express();
app.use(express.json({ limit: "1mb" }));

// ✅ Test endpoint
app.get("/webhook", (req, res) => {
  res.send("✅ Webhook endpoint is active! Waiting for POST requests from GitHub.");
});

// 📦 Webhook endpoint
app.post("/webhook", async (req, res) => {
  const event = req.headers["x-github-event"];
  console.log("📩 GITHUB EVENT:", event);

  if (event === "ping") {
    console.log("✅ Webhook connection verified!");
  } else if (event === "pull_request") {
    const action = req.body.action;
    const pr = req.body.pull_request;
    const repo = req.body.repository.full_name;

    console.log(`🧩 Pull Request ${action}: "${pr.title}"`);

    if (action === "opened" || action === "synchronize") {
      const summary = `
📝 PR Description:
This PR includes changes to the "${repo}" repository titled "${pr.title}".
A total of ${pr.changed_files} files were modified,
with ${pr.additions} lines added and ${pr.deletions} lines deleted.
`;

      try {
        const response = await fetch(pr.url, {
          method: "PATCH",
          headers: {
            "Authorization": `Bearer ${process.env.GITHUB_TOKEN}`,
            "Accept": "application/vnd.github+json",
          },
          body: JSON.stringify({ body: summary }),
        });
        console.log("📦 PR description updated:", response.status);
      } catch (err) {
        console.error("❌ Error updating PR description:", err);
      }
    }
  }

  res.status(200).send("ok");
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Bun server running on port ${PORT}`));
