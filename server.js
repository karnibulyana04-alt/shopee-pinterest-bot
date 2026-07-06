require("dotenv").config();
const express = require("express");
const cron = require("node-cron");
const { nanoid } = require("nanoid");
const axios = require("axios");

const { scrapeShopeeProduct } = require("./services/shopeeScraper");
const { generateCaption } = require("./services/captionGenerator");
const db = require("./services/db");

const app = express();
app.use(express.json());
app.use(express.static("public"));

const PORT = process.env.PORT || 3000;

// ---------- 1. GENERATE (scrape Shopee + AI caption) ----------

app.post("/api/generate", async (req, res) => {
  try {
    const { shopeeLink, title: userTitle } = req.body;
    if (!shopeeLink) return res.status(400).json({ error: "shopeeLink wajib diisi" });

    let product = { image: null, title: userTitle, description: null };
    try {
      product = await scrapeShopeeProduct(shopeeLink);
      if (!product.title) product.title = userTitle;
    } catch (e) {
      console.warn("Scrape Shopee gagal, pakai fallback title dari user:", e.message);
    }

    const caption = await generateCaption({
      title: product.title || userTitle,
      description: product.description,
      affiliateLink: shopeeLink,
    });

    res.json({
      image: product.image,
      title: product.title || userTitle,
      caption,
    });
  } catch (err) {
    console.error(err.response?.data || err.message);
    res.status(500).json({ error: "Gagal generate konten" });
  }
});

// ---------- 2. SCHEDULE (disimpan di app kita, dieksekusi lewat Make.com) ----------

app.post("/api/schedule", async (req, res) => {
  const { boardName, title, caption, link, imageUrl, scheduledAt } = req.body;
  if (!boardName || !imageUrl || !scheduledAt) {
    return res.status(400).json({ error: "boardName, imageUrl, scheduledAt wajib diisi" });
  }

  const post = {
    id: nanoid(),
    boardName,
    title,
    caption,
    link,
    imageUrl,
    scheduledAt,
    status: "pending",
    createdAt: new Date().toISOString(),
  };

  db.get("scheduledPosts").push(post).write();
  res.json({ ok: true, post });
});

app.get("/api/schedule", (req, res) => {
  res.json(db.get("scheduledPosts").value());
});

app.delete("/api/schedule/clear-posted", (req, res) => {
  db.get("scheduledPosts").remove({ status: "posted" }).write();
  res.json({ ok: true });
});

app.delete("/api/schedule/:id", (req, res) => {
  db.get("scheduledPosts").remove({ id: req.params.id }).write();
  res.json({ ok: true });
});

// ---------- 3. CRON: kirim ke Make.com Webhook pas waktunya ----------
// Make.com yang pegang koneksi resmi ke Pinterest (connect sekali di Make.com,
// gak perlu app Pinterest sendiri / nunggu approval).

cron.schedule("* * * * *", async () => {
  const now = new Date();
  const due = db
    .get("scheduledPosts")
    .filter((p) => p.status === "pending" && new Date(p.scheduledAt) <= now)
    .value();

  if (due.length === 0) return;

  const webhookUrl = process.env.MAKE_WEBHOOK_URL;
  if (!webhookUrl) {
    console.warn("MAKE_WEBHOOK_URL belum diisi, gak bisa kirim post yang due.");
    return;
  }

  for (const post of due) {
    try {
      await axios.post(webhookUrl, {
        board_name: post.boardName,
        title: post.title,
        description: post.caption,
        link: post.link,
        image_url: post.imageUrl,
      });
      db.get("scheduledPosts")
        .find({ id: post.id })
        .assign({ status: "posted", postedAt: new Date().toISOString() })
        .write();
      console.log(`✅ Terkirim ke Make.com: ${post.title}`);
    } catch (err) {
      console.error(`❌ Gagal kirim ke Make.com (${post.id}):`, err.response?.data || err.message);
      db.get("scheduledPosts")
        .find({ id: post.id })
        .assign({ status: "failed", error: err.message })
        .write();
    }
  }
});

app.listen(PORT, () => {
  const groqKey = process.env.GROQ_API_KEY || "";
