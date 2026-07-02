const axios = require('axios');

/**
 * Generate caption Pinterest gaya storytelling + CTA klik link,
 * pakai Google Gemini API (GRATIS, gak perlu kartu kredit).
 * Dapetin API key di: https://aistudio.google.com/apikey
 */
async function generateCaption({ title, description, affiliateLink }) {
  const prompt = `Kamu adalah content writer Pinterest yang ahli bikin caption storytelling untuk affiliate marketing.

Produk: "${title}"
Deskripsi tambahan: "${description || '-'}"

Tulis 1 caption Pinterest (bahasa Indonesia, santai tapi persuasif) dengan struktur:
1. Kalimat pembuka yang relate / bikin penasaran (pengalaman pribadi singkat atau masalah yang relate)
2. 2-3 kalimat storytelling kenapa produk ini membantu
3. Call-to-action yang natural buat klik link di bio/link produk (jangan sebut "link di bio" secara kaku, buat variatif)
4. Tambahkan 5-8 hashtag relevan di akhir

Panjang total maksimal 400 karakter (limit Pinterest description). Jangan pakai emoji berlebihan (maks 3). Jangan buat klaim medis/berlebihan yang tidak bisa dipertanggungjawabkan.

Balas HANYA dengan teks captionnya saja, tanpa penjelasan tambahan.`;

  const response = await axios.post(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
    {
      contents: [{ parts: [{ text: prompt }] }],
    },
    {
      headers: { 'content-type': 'application/json' },
    }
  );

  const text = response.data.candidates?.[0]?.content?.parts?.[0]?.text;
  return text ? text.trim() : '';
}

module.exports = { generateCaption };
