const axios = require("axios");

/**
 * Generate caption Pinterest gaya storytelling + CTA klik link,
 * pakai Claude API (Anthropic).
 */
async function generateCaption({ title, description, affiliateLink }) {
  const prompt = `Kamu adalah content writer Pinterest yang ahli bikin caption storytelling untuk affiliate marketing.

Produk: "${title}"
Deskripsi tambahan: "${description || "-"}"

Tulis 1 caption Pinterest (bahasa Indonesia, santai tapi persuasif) dengan struktur:
1. Kalimat pembuka yang relate / bikin penasaran (pengalaman pribadi singkat atau masalah yang relate)
2. 2-3 kalimat storytelling kenapa produk ini membantu
3. Call-to-action yang natural buat klik link di bio/link produk (jangan sebut "link di bio" secara kaku, buat variatif)
4. Tambahkan 5-8 hashtag relevan di akhir

Panjang total maksimal 400 karakter (limit Pinterest description). Jangan pakai emoji berlebihan (maks 3). Jangan buat klaim medis/berlebihan yang tidak bisa dipertanggungjawabkan.

Balas HANYA dengan teks captionnya saja, tanpa penjelasan tambahan.`;

  const response = await axios.post(
    "https://api.anthropic.com/v1/messages",
    {
      model: "claude-sonnet-4-6",
      max_tokens: 400,
      messages: [{ role: "user", content: prompt }],
    },
    {
      headers: {
        "content-type": "application/json",
        "x-api-key": process.env.ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
      },
    }
  );

  const textBlock = response.data.content.find((c) => c.type === "text");
  return textBlock ? textBlock.text.trim() : "";
}

module.exports = { generateCaption };
