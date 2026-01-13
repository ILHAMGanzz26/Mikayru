import axios from "axios";
import fs from "fs";
import path from "path";
import mime from "mime-types"; // npm install mime-types

let fbHandler = async (m, { conn, text }) => {
  if (!text) return m.reply("❌ Masukkan link Facebook!");
  
  await conn.sendMessage(m.chat, { react: { text: '⏳', key: m.key } })

  try {
    const fbUrl = decodeURIComponent(text);

    // 1️⃣ Ambil info dari API
    const apiUrl = `https://api.elrayyxml.web.id/api/downloader/facebook?url=${encodeURIComponent(fbUrl)}`;
    const { data } = await axios.get(apiUrl);

    if (!data.status) return m.reply("❌ Gagal mengambil data dari API.");

    const { title, video_hd, audio: audioUrl, duration } = data.result;

    // 2️⃣ Download video dulu
    const videoRes = await axios.get(video_hd, { responseType: "arraybuffer" });
    const videoType = videoRes.headers['content-type'] || 'video/mp4';
    const videoExt = mime.extension(videoType) || 'mp4';
    const tmpVideo = path.join('/tmp', `fb_video_${Date.now()}.${videoExt}`);
    fs.writeFileSync(tmpVideo, videoRes.data);

    await conn.sendMessage(
      m.chat,
      {
        video: { url: tmpVideo },
        mimetype: videoType,
        fileName: `${title || "video"}.${videoExt}`,
        caption: title || "Video Facebook",
        contextInfo: {
          externalAdReply: {
            title: title || "Facebook Video",
            body: duration ? `Durasi: ${duration} detik` : "Video dari Facebook",
            mediaUrl: fbUrl,
            mediaType: 2,
            renderLargerThumbnail: true,
          },
        },
      },
      { quoted: m }
    );

    fs.unlinkSync(tmpVideo);

    // 3️⃣ Download audio menyusul
    const audioRes = await axios.get(audioUrl, { responseType: "arraybuffer" });
    const audioType = audioRes.headers['content-type'] || 'audio/mp4';
    const audioExt = mime.extension(audioType) || 'mp4';
    const tmpAudio = path.join('/tmp', `fb_audio_${Date.now()}.${audioExt}`);
    fs.writeFileSync(tmpAudio, audioRes.data);

    await conn.sendMessage(
      m.chat,
      {
        audio: { url: tmpAudio },
        mimetype: audioType,
        fileName: `${title || "audio"}.${audioExt}`,
        ptt: false,
      },
      { quoted: m }
    );

    fs.unlinkSync(tmpAudio);

  } catch (err) {
    console.error("❌ Error kirim FB:", err);
    m.reply("⚠️ Terjadi kesalahan saat mengirim video/audio.");
  }
};

fbHandler.help = ["facebook", "fb"];
fbHandler.tags = ["downloader"];
fbHandler.command = /^facebook|fb$/i;

export default fbHandler;