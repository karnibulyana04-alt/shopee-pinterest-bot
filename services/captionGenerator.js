const axios = require("axios");

/**
 * Generate caption Pinterest gaya storytelling + CTA klik link,
 * pakai Groq API (GRATIS, gak perlu kartu kredit).
 * Dapetin API key di: https://console.groq.com/keys
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
    "https://api.groq.com/openai/v1/chat/completions",
    {
      model: "llama-3.3-70b-versatile",
      messages: [{ role: "user", content: prompt }],
    },
    {
      headers: {
        "content-type": "application/json",
        Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
      },
    }
  );

  const text = response.data.choices?.[0]?.message?.content;
