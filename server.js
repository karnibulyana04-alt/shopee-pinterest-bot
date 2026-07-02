require("dotenv").config();
const express = require("express");
const { nanoid } = require("nanoid");

const { scrapeShopeeProduct } = require("./services/shopeeScraper");
const { generateCaption } = require("./services/captionGenerator");
const {
  exchangeCodeForToken,
  refreshToken,
  listBoards,
  createPin,
} = require("./services/pinterest");
const db = require("./services/db");

const app = express();
app.use(express.json());
app.use(express.static("public"));

const PORT = process.env.PORT || 3000;

// ---------- 1. PINTEREST OAUTH ----------

app.get("/auth/pinterest", (req, res) => {
  const scopes = ["boards:read", "pins:read", "pins:write"].join(",");
  const url =
    `https://www.pinterest.com/oauth/?` +
    `client_id=${process.env.PINTEREST_APP_ID}` +
    `&redirect_uri=${encodeURIComponent(process.env.PINTEREST_REDIRECT_URI)}` +
    `&response_type=code&scope=${encodeURIComponent(scopes)}`;
  res.redirect(url);
});

app.get("/auth/pinterest/callback", async (req, res) => {
  try {
    const { code } = req.query;
    const tokenData = await exchangeCodeForToken(code);
    db.set("tokens", {
      access_token: tokenData.access_token,
      refresh_token: tokenData.refresh_token,
      obtained_at: Date.now(),
      expires_in: tokenData.expires_in,
    }).write();
    res.redirect("/?connected=1");
  } catch (err) {
    console.error(err.response?.data || err.message);
    res.status(500).send("Gagal konek ke Pinterest. Cek console server.");
  }
});

app.get("/api/status", (req, res) => {
  const tokens = db.get("tokens").value();
  res.json({ connected: !!tokens });
});

app.get("/api/boards", async (req, res) => {
  try {
    const tokens = db.get("tokens").value();
    if (!tokens) return res.status(401).json({ error: "Belum connect Pinterest" });
    const boards = await listBoards(tokens.access_token);
    res.json(boards);
  } catch (err) {
    console.error(err.response?.data || err.message);
    res.status(500).json({ error: "Gagal ambil boards" });
  }
});

// ---------- 2. GENERATE (scrape Shopee + AI caption) ----------

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
      image: product.image, // null jika scraping gagal -> frontend minta upload manual
      title: product.title || userTitle,
      caption,
    });
  } catch (err) {
    console.error(err.response?.data || err.message);
    res.status(500).json({ error: "Gagal generate konten" });
  }
});

// ---------- 3. SCHEDULE ----------

app.post("/api/schedule", async (req, res) => {
  const { boardId, title, caption, link, imageUrl, scheduledAt } = req.body;
  if (!boardId || !imageUrl || !scheduledAt) {
    return res.status(400).json({ error: "boardId, imageUrl, scheduledAt wajib diisi" });
  }

  try {
    const accessToken = await ensureFreshToken();
    if (!accessToken) return res.status(401).json({ error: "Belum connect Pinterest" });

    // Kirim langsung ke Pinterest dengan publish_at -- Pinterest sendiri yang
    // nyimpen & publish di waktu tsb, gak perlu server kita nyala terus.
    const pinterestPin = await createPin(accessToken, {
      boardId,
      title,
      description: caption,
      link,
      imageUrl,
      publishAt: new Date(scheduledAt).toISOString(),
    });

    const post = {
      id: nanoid(),
      pinterestPinId: pinterestPin.id,
      boardId,
      title,
      caption,
      link,
      imageUrl,
      scheduledAt,
      status: "scheduled_on_pinterest",
      createdAt: new Date().toISOString(),
    };

    db.get("scheduledPosts").push(post).write();
    res.json({ ok: true, post });
  } catch (err) {
    console.error(err.response?.data || err.message);
    res.status(500).json({ error: "Gagal jadwalkan ke Pinterest" });
  }
});

app.get("/api/schedule", (req, res) => {
  res.json(db.get("scheduledPosts").value());
});

app.delete("/api/schedule/:id", (req, res) => {
  db.get("scheduledPosts").remove({ id: req.params.id }).write();
  res.json({ ok: true });
});

// ---------- 4. TOKEN REFRESH HELPER ----------
// Publishing sekarang native lewat parameter publish_at Pinterest,
// jadi gak perlu cron sendiri buat publish di waktu terjadwal.

async function ensureFreshToken() {
  const tokens = db.get("tokens").value();
  if (!tokens) return null;

  const isExpiringSoon =
    Date.now() - tokens.obtained_at > (tokens.expires_in - 300) * 1000;

  if (isExpiringSoon && tokens.refresh_token) {
    const fresh = await refreshToken(tokens.refresh_token);
    const updated = {
      access_token: fresh.access_token,
      refresh_token: fresh.refresh_token || tokens.refresh_token,
      obtained_at: Date.now(),
      expires_in: fresh.expires_in,
    };
    db.set("tokens", updated).write();
    return updated.access_token;
  }
  return tokens.access_token;
}

app.listen(PORT, () => {
  const key = process.env.GEMINI_API_KEY || "";
  console.log(
    `🔑 GEMINI_API_KEY check → length: ${key.length}, starts: "${key.slice(0, 6)}", ends: "${key.slice(-6)}"`
  );`);
});
