import axios from "axios";
import { Sticker } from "wa-sticker-formatter";

let handler = async (m, { conn, text, usedPrefix, command }) => {
  if (!text) {
    return conn.sendMessage(
      m.chat,
      {
        text: `🍙 *Masukkan teks untuk dibuat Brat Anime Sticker!*\n\n🍤 *Contoh:* ${usedPrefix + command} Lari Ada Wibu`,
      },
      { quoted: m }
    );
  }

  try {
    const encoded = encodeURIComponent(text);

    // 🔥 API BRAT ANIME VIDEO
    const api = `https://api.ilhm.my.id/canvas/brat-anime_vid?text=${encoded}`;

    const { data } = await axios.get(api, {
      timeout: 30000,
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Mobile Safari/537.36",
        "Accept": "application/json"
      }
    });

    if (!data.status || !data.result?.url) {
      throw new Error("Response API tidak valid");
    }

    // 🔽 Ambil video MP4 sebagai buffer
    const video = await axios.get(data.result.url, {
      responseType: "arraybuffer",
      timeout: 30000,
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Mobile Safari/537.36"
      }
    });

    // 🔥 Convert VIDEO → STICKER
    const sticker = new Sticker(video.data, {
      pack: global.config?.stickpack || "Brat Anime",
      author: global.config?.stickauth || "ILHAM A.",
      type: "full",
      quality: 50
    });

    await conn.sendMessage(
      m.chat,
      { sticker: await sticker.toBuffer() },
      { quoted: m }
    );

  } catch (e) {
    console.error(e);
    await conn.sendMessage(
      m.chat,
      { text: `❌ *Gagal membuat Brat Anime Sticker*\n${e.message}` },
      { quoted: m }
    );
  }
};

handler.help = ["bratanime <teks>"];
handler.tags = ["maker", "sticker"];
handler.command = /^(bratanime)$/i;

export default handler;