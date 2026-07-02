const axios = require("axios");
const cheerio = require("cheerio");

/**
 * Ambil metadata produk (gambar, judul, harga) dari link Shopee affiliate.
 * Menggunakan Open Graph tags yang tersedia di halaman produk Shopee.
 *
 * CATATAN: Shopee kadang render via JS sehingga OG tags bisa saja tidak
 * lengkap untuk sebagian link. Kalau gagal, endpoint akan minta user
 * upload gambar manual sebagai fallback (lihat public/index.html).
 */
async function scrapeShopeeProduct(url) {
  const res = await axios.get(url, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36",
      "Accept-Language": "id-ID,id;q=0.9",
    },
    timeout: 15000,
  });

  const $ = cheerio.load(res.data);

  const ogImage = $('meta[property="og:image"]').attr("content");
  const ogTitle = $('meta[property="og:title"]').attr("content");
  const ogDescription = $('meta[property="og:description"]').attr("content");

  return {
    image: ogImage || null,
    title: ogTitle || null,
    description: ogDescription || null,
    sourceUrl: url,
  };
}

module.exports = { scrapeShopeeProduct };
