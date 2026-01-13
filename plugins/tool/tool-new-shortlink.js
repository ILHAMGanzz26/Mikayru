import fetch from "node-fetch";

let handler = async (m, { conn, text }) => {
  if (!text) return m.reply("❗ *Masukkan URL yang ingin dipendekkan.*\n\nContoh: .short https://google.com");

  // validasi link
  if (!/^https?:\/\//i.test(text)) {
    return m.reply("❗ *Link tidak valid!*\nPastikan diawali http:// atau https://");
  }

  try {
    // API Shortener
    let api = `https://tinyurl.com/api-create.php?url=${encodeURIComponent(text)}`;
    let short = await fetch(api).then(r => r.text());

    if (!short || short.includes("Error")) {
      return m.reply("❌ Gagal memperpendek URL. Coba lagi.");
    }

    await m.reply(`🔗 *URL Berhasil Dipendekkan!*\n\n📄 Asli: ${text}\n✨ Pendek: ${short}`);
  } catch (e) {
    console.error(e);
    m.reply("❌ Terjadi kesalahan saat memproses permintaan.");
  }
};

handler.help = ["short", "shortlink"];
handler.tags = ["tools"];
handler.command = /^(short|shorturl|perpendek|shorten)$/i;

export default handler;