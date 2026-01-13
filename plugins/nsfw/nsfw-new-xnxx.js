import fetch from "node-fetch";

let handler = async (m, { conn, text, usedPrefix, command }) => {
  if (!text) return m.reply(`🚨 Masukkan kata kunci!\n\nContoh: *${usedPrefix + command} girl*`);

  try {
    let url = `https://api.nekolabs.my.id/discovery/xnxx/search?q=${encodeURIComponent(text)}`;
    let res = await fetch(url);
    let json = await res.json();

    if (!json.status || !json.result || json.result.length === 0)
      return m.reply("❌ Tidak ada hasil ditemukan!");

    // Buat daftar hasil dalam satu pesan
    let list = json.result
      .map((v, i) => 
        `🔹 *${i + 1}. ${v.title || "Tanpa judul"}*\n` +
        `👁️ Views: ${v.views || "-"}\n` +
        `📺 Resolusi: ${v.resolution || "-"}\n` +
        `⏱️ Durasi: ${v.duration || "-"}\n` +
        `${v.url ? `🔗 URL: ${v.url}` : ""}\n`
      )
      .join("\n─────────────────\n");

    let caption = `📜 *Hasil Pencarian: ${text}*\n\n${list}`;
    await m.reply(caption);
  } catch (err) {
    console.error(err);
    m.reply("❌ Terjadi kesalahan saat mengambil data API.");
  }
};

handler.help = ["xnxx"];
handler.tags = ["nsfw"];
handler.command = /^xnxx$/i;

export default handler;