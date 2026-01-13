import axios from "axios";
import { Sticker } from "wa-sticker-formatter";

let handler = async (m, { conn, text, usedPrefix, command }) => {
  if (!text) {
    return conn.sendMessage(
      m.chat,
      {
        text: `🍙 *Masukkan teks untuk dibuat Brat Sticker!*\n\n🍤 *Contoh:* ${usedPrefix + command} Lari Ada Wibu`,
      },
      { quoted: m }
    );
  }

  const encoded = encodeURIComponent(text);

  // List API utama + cadangan
  const apis = [
    `https://api.nekolabs.my.id/canvas/brat/v1?text=${encoded}`,
    `https://api.zenzxz.my.id/api/maker/brat?text=${encoded}`,
    `https://api.elrayyxml.web.id/api/maker/brat?text=${encoded}`,
    `https://anabot.my.id/api/maker/brat?text=${encoded}&apikey=freeApikey`,
    `https://zelapioffciall.koyeb.app/canvas/bratv2?text=${encoded}`,
  ];

  let buffer = null;
  let lastError;

  // loop fallback API
  for (let api of apis) {
    try {
      const res = await axios.get(api, {
        responseType: "arraybuffer",
        timeout: 15000,
      });

      buffer = res.data;
      break; // stop jika sukses
    } catch (e) {
      lastError = e;
    }
  }

  if (!buffer) {
    return conn.sendMessage(
      m.chat,
      {
        text: `❌ *Semua API Brat gagal diakses!*\n\n${lastError?.message || ""}`,
      },
      { quoted: m }
    );
  }

  try {
    const sticker = new Sticker(buffer, {
      pack: global.config?.stickpack || "Brat Sticker",
      author: global.config?.stickauth || "WA Bot",
      type: "full",
    });

    await conn.sendMessage(
      m.chat,
      { sticker: await sticker.toBuffer() },
      { quoted: m }
    );
  } catch (e) {
    await conn.sendMessage(
      m.chat,
      { text: `❌ Gagal membuat sticker\n${e.message}` },
      { quoted: m }
    );
  }
};

handler.help = ["brat <teks>"];
handler.tags = ["maker", "sticker"];
handler.command = /^brat$/i;

export default handler;