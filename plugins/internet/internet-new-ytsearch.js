import axios from "axios";

let handler = async (m, { conn, text, usedPrefix, command }) => {
  if (!text) {
    return conn.sendMessage(
      m.chat,
      {
        text:
          `📺 *YouTube Search*\n\n` +
          `🔎 Masukkan kata kunci!\n` +
          `📝 Contoh:\n${usedPrefix + command} Aku kamu dan samudra`,
      },
      { quoted: m }
    );
  }

  try {
    const query = encodeURIComponent(text);
    const api = `https://api.ilhm.my.id/search/youtube?q=${query}`;

    const { data } = await axios.get(api, {
      timeout: 20000,
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Mobile Safari/537.36",
        Accept: "application/json",
      },
    });

    if (!data.status || !Array.isArray(data.result) || !data.result.length) {
      throw new Error("Hasil tidak ditemukan");
    }

    const list = data.result.slice(0, 7);

    let caption = `📺 *Y O U T U B E  S E A R C H*\n`;
    caption += `━━━━━━━━━━━━━━━━━━━\n`;
    caption += `🔍 *Query*   : ${text}\n`;
    caption += `👤 *Creator* : ${data.creator}\n`;
    caption += `━━━━━━━━━━━━━━━━━━━\n\n`;

    list.forEach((v, i) => {
      caption += `🎬 *${i + 1}. ${v.title}*\n`;
      caption += `📡 ${v.channel}\n`;
      caption += `⏱️ ${v.duration}\n`;
      caption += `🔗 ${v.link}\n`;
      caption += `───────────────────\n`;
    });

    caption += `\n💡 *Tips:* Ketik nomor video untuk download.`;

    // 🔥 Kirim dengan thumbnail video pertama
    await conn.sendMessage(
      m.chat,
      {
        image: { url: list[0].imageUrl },
        caption: caption.trim(),
      },
      { quoted: m }
    );
  } catch (e) {
    console.error(e);
    await conn.sendMessage(
      m.chat,
      {
        text:
          `❌ *Gagal mencari YouTube*\n` +
          `⚠️ ${e.message}`,
      },
      { quoted: m }
    );
  }
};

handler.help = ["yts <query>"];
handler.tags = ["search"];
handler.command = /^(yts|youtubesearch)$/i;

export default handler;