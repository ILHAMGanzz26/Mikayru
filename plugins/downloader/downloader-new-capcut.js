import fetch from "node-fetch";

let handler = async (m, { conn, text, usedPrefix, command }) => {
  if (!text) {
    return m.reply(`📥 *Downloader CapCut*\n\nContoh penggunaan:\n> ${usedPrefix + command} https://www.capcut.com/template-detail/...`);
  }

  try {
    const apiUrl = `https://api.elrayyxml.web.id/api/downloader/capcut?url=${encodeURIComponent(text)}`;
    const res = await fetch(apiUrl);
    const json = await res.json();

    if (!json.status) throw "Gagal mengambil data dari API.";

    const result = json.result;

    const caption = `
╭─❏ *CAPCUT DOWNLOADER*
│ 🎬 *Judul:* ${result.title}
│ 👤 *Pembuat:* ${result.author}
│ 🪄 *Sumber:* CapCut Template
╰──────────────◆
`;

    // Kirim video dengan thumbnail (gambar di atas video)
    await conn.sendMessage(m.chat, {
      video: { url: result.url },
      jpegThumbnail: await (await fetch(result.thumbnail)).buffer(), // thumbnail di atas video
      caption,
    }, { quoted: m });

  } catch (e) {
    console.error(e);
    m.reply("❌ Terjadi kesalahan! Pastikan link CapCut valid atau coba lagi nanti.");
  }
};

handler.help = ["capcut <url>"];
handler.tags = ["downloader"];
handler.command = /^(capcut|cc)$/i;

export default handler;