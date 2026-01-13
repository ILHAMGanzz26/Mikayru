import fetch from "node-fetch";

let handler = async (m, { conn, text, usedPrefix, command }) => {
  try {
    if (!text)
      return m.reply(`*🚨 Masukkan URL Video Xnxx!*\n\n> Contoh:\n${usedPrefix + command} https://www.xnxx.com/....`);

    m.reply("⏳ Tunggu sebentar, sedang memproses video...");

    const api = `https://api.nekolabs.my.id/downloader/xnxx?url=${encodeURIComponent(text)}`;
    const res = await fetch(api);
    const json = await res.json();

    if (!json.status || !json.result)
      return m.reply("❌ Gagal mengambil data. Pastikan link valid atau coba lagi nanti.");

    const { videos, thumb } = json.result;
    const videoHD = videos.high;
    const videoLow = videos.low;
    const videoUrl = videoHD || videoLow;

    if (!videoUrl)
      return m.reply("⚠️ Tidak ada video yang bisa diunduh dari link ini.");

    let quality = videoHD ? "HD" : "Low";

    let caption = `🎬 *XNXX DOWNLOADER*\n\n`
      + `📹 *Kualitas:* ${quality}\n`
      + `📥 *Sedang mengirim video...*`;

    await conn.sendMessage(
      m.chat,
      {
        video: { url: videoUrl },
        caption,
        thumbnail: thumb ? await (await fetch(thumb)).buffer() : null,
        mimetype: "video/mp4",
      },
      { quoted: m }
    );
  } catch (e) {
    console.error(e);
    m.reply("❌ Terjadi kesalahan saat memproses permintaan.");
  }
};

handler.help = ["xnxxdl <url>"];
handler.tags = ["downloader"];
handler.command = /^xnxx(dl|download)?$/i;

export default handler;