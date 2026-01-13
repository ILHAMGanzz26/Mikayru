import fs from "fs";
import path from "path";
import sharp from "sharp";
import ffmpeg from "fluent-ffmpeg";
import ffmpegPath from "ffmpeg-static";

ffmpeg.setFfmpegPath(ffmpegPath);

let handler = async (m, { conn }) => {
  const q = m.quoted ? m.quoted : m;
  const mime = (q.msg || q).mimetype || q.mediaType || "";
  if (!/webp/.test(mime))
    return m.reply("🍙 *Balas stiker dengan perintah .tovideo*");

  const tmpWebp = path.join("/tmp", `${Date.now()}.webp`);
  const tmpGif = path.join("/tmp", `${Date.now()}.gif`);
  const tmpMp4 = path.join("/tmp", `${Date.now()}.mp4`);

  try {
    const buffer = await q.download();
    fs.writeFileSync(tmpWebp, buffer);

    // Konversi stiker (animated webp) ke GIF
    await sharp(tmpWebp, { animated: true })
      .gif({ loop: 0 })
      .toFile(tmpGif);

    // Konversi GIF ke video MP4
    await new Promise((resolve, reject) => {
      ffmpeg(tmpGif)
        .outputOptions([
          "-movflags faststart",
          "-pix_fmt yuv420p",
          "-vf",
          "scale=trunc(iw/2)*2:trunc(ih/2)*2,fps=15",
        ])
        .save(tmpMp4)
        .on("end", resolve)
        .on("error", reject);
    });

    await conn.sendFile(
      m.chat,
      tmpMp4,
      "sticker.mp4",
      "🍱 *Berhasil mengonversi stiker ke video!*",
      m
    );
  } catch (e) {
    console.error(e);
    m.reply(`🥟 *Gagal mengonversi stiker ke video!*\n🍧 ${e.message}`);
  } finally {
    [tmpWebp, tmpGif, tmpMp4].forEach((f) => {
      if (fs.existsSync(f)) fs.unlinkSync(f);
    });
  }
};

handler.help = ["tovideo"];
handler.tags = ["tools"];
handler.command = /^tovideo$/i;

export default handler;