import fetch from "node-fetch";
import fs from "fs";
import { exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);

let handler = async (m, { conn, args, usedPrefix, command }) => {
  try {
    if (!args[0]) {
      return m.reply(
        `🍙 *Masukkan teks untuk dibuat BratVideo!*\n\n🍤 *Contoh:* ${usedPrefix + command} Konichiwa`
      );
    }

    const text = encodeURIComponent(args.join(" "));

    // 🔁 API cadangan (SESUAI PERMINTAAN)
    const apis = [
      `https://api.zenzxz.my.id/api/maker/bratvid?text=${text}`,
      `https://api.elrayyxml.web.id/api/maker/bratvid?text=${text}`,
      `https://anabot.my.id/api/maker/bratGif?text=${text}&apikey=freeApikey`,
      `https://zelapioffciall.koyeb.app/canvas/bratvid?text=${text}`,
    ];

    let mediaBuffer = null;
    let lastError;

    // 🔄 Loop fallback
    for (let api of apis) {
      try {
        const res = await fetch(api, { timeout: 20000 });
        if (!res.ok) throw new Error(`API ${res.status}`);
        mediaBuffer = Buffer.from(await res.arrayBuffer());
        break;
      } catch (e) {
        lastError = e;
      }
    }

    if (!mediaBuffer) {
      return m.reply(
        `❌ *Semua API BratVideo gagal!*\n\n${lastError?.message || ""}`
      );
    }

    // 📁 file sementara
    const id = Date.now();
    const input = `./tmp/brat_${id}`;
    const output = `./tmp/brat_${id}.webp`;

    // Simpan sebagai input universal
    fs.writeFileSync(input, mediaBuffer);

    // 🎥 Konversi MP4 / GIF → WEBP sticker
    await execAsync(
      `ffmpeg -y -i "${input}" -vf "scale=512:512:force_original_aspect_ratio=decrease,fps=15,pad=512:512:-1:-1:color=white@0.0" -loop 0 -t 8 -an -vsync 0 "${output}"`
    );

    // 📤 Kirim sticker animasi
    await conn.sendFile(
      m.chat,
      output,
      "bratvideo.webp",
      "",
      m,
      false,
      { asSticker: true }
    );

    // 🧹 cleanup
    fs.unlinkSync(input);
    fs.unlinkSync(output);

  } catch (e) {
    console.error(e);
    m.reply(`🍩 *Terjadi Kesalahan Teknis!*\n\n🧁 *Detail:* ${e.message}`);
  }
};

handler.help = ["bratvideo <teks>"];
handler.tags = ["maker"];
handler.command = /^(bratvideo|bratvid)$/i;

export default handler;