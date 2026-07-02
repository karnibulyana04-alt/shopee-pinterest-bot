const axios = require("axios");

const PINTEREST_API = "https://api.pinterest.com/v5";

/** Tukar authorization code jadi access_token + refresh_token */
async function exchangeCodeForToken(code) {
  const basicAuth = Buffer.from(
    `${process.env.PINTEREST_APP_ID}:${process.env.PINTEREST_APP_SECRET}`
  ).toString("base64");

  const res = await axios.post(
    `${PINTEREST_API}/oauth/token`,
    new URLSearchParams({
      grant_type: "authorization_code",
      code,
      redirect_uri: process.env.PINTEREST_REDIRECT_URI,
    }),
    {
      headers: {
        Authorization: `Basic ${basicAuth}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
    }
  );
  return res.data; // { access_token, refresh_token, expires_in, ... }
}

async function refreshToken(refresh_token) {
  const basicAuth = Buffer.from(
    `${process.env.PINTEREST_APP_ID}:${process.env.PINTEREST_APP_SECRET}`
  ).toString("base64");

  const res = await axios.post(
    `${PINTEREST_API}/oauth/token`,
    new URLSearchParams({
      grant_type: "refresh_token",
      refresh_token,
    }),
    {
      headers: {
        Authorization: `Basic ${basicAuth}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
    }
  );
  return res.data;
}

async function listBoards(accessToken) {
  const res = await axios.get(`${PINTEREST_API}/boards`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  return res.data.items || [];
}

/**
 * Buat pin baru di Pinterest (dipanggil oleh cron scheduler pas waktunya,
 * BUKAN saat user klik "jadwalkan" -- ini bikin postingan beneran publish).
 */
async function createPin(accessToken, { boardId, title, description, link, imageUrl, publishAt }) {
  const payload = {
    board_id: boardId,
    title,
    description,
    link,
    media_source: {
      source_type: "image_url",
      url: imageUrl,
    },
  };
  // native Pinterest scheduling — Pinterest sendiri yang publish di waktu ini,
  // gak perlu cron kita jalan terus-menerus
  if (publishAt) payload.publish_at = publishAt; // format ISO 8601, misal 2026-07-10T08:00:00Z

  const res = await axios.post(
    `${PINTEREST_API}/pins`,
    payload,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
    }
  );
  return res.data;
}

module.exports = { exchangeCodeForToken, refreshToken, listBoards, createPin };
