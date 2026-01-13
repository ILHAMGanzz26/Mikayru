/* import yts from "yt-search";

let handler = async (m, { conn, text, usedPrefix, command }) => {
    if (!text) return m.reply(`🍙 *Contoh penggunaan:* ${usedPrefix + command} https://youtube.com/watch?v=xxxxxx atau judul lagu`);
    try {
        await global.loading(m, conn);

        let video;
        // cek apakah input adalah link YouTube
        const ytRegex = /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)\//i;
        if (ytRegex.test(text)) {
            // kalau link langsung
            let id = text.split("v=")[1] || text.split("/").pop();
            let search = await yts({ videoId: id });
            video = search;
        } else {
            // kalau bukan link, lakukan pencarian
            let search = await yts(text);
            if (!search.videos || !search.videos.length)
                return m.reply(`🍰 *Maaf, tidak dapat menemukan lagu dengan kata "${text}"*`);
            video = search.videos[0];
        }

        let detail = `
🍙 *Judul:* ${video.title}
🍜 *Durasi:* ${video.timestamp || "-"} (${video.seconds}s)
🍡 *Views:* ${formatNumber(video.views)}
🍰 *Channel:* ${video.author.name}${video.author.verified ? " 🥇" : ""}
🍵 *Upload:* ${video.ago || "-"}
━━━━━━━━━━━━━━━━━━━
🍱 *Pilih format unduhan di bawah ini~*
`.trim();

        await conn.sendMessage(
            m.chat,
            {
                image: { url: video.thumbnail },
                caption: detail,
                footer: "YouTube Downloader",
                title: "🍛 YouTube Play",
                interactiveButtons: [
                    {
                        name: "single_select",
                        buttonParamsJson: JSON.stringify({
                            title: "🍱 Pilih Format",
                            sections: [
                                {
                                    title: "🎶 Audio & 📹 Video",
                                    rows: [
                                        {
                                            header: "🎵 Audio",
                                            title: "YTMP3",
                                            description: "🎧 Unduh MP3 kualitas terbaik",
                                            id: `.yta ${text}`,
                                        },
                                        {
                                            header: "🎥 Video",
                                            title: "YTMP4",
                                            description: "📺 Unduh MP4 kualitas standar",
                                            id: `.ytv ${video.url}`,
                                        },
                                        {
                                            header: "📖 Info",
                                            title: "Lirik / Detail Lagu",
                                            description: "🔍 Cari lirik atau info tambahan",
                                            id: `.lyrics ${text}`,
                                        },
                                    ],
                                },
                            ],
                        }),
                    },
                ],
            },
            { quoted: m }
        );
    } catch (e) {
        console.error(e);
        m.reply("🍰 *Terjadi kesalahan saat memproses permintaan.*");
    } finally {
        await global.loading(m, conn, true);
    }
};

handler.help = ["play"];
handler.tags = ["downloader"];
handler.command = /^(play)$/i;

export default handler;

function formatNumber(num) {
    if (num >= 1e9) return (num / 1e9).toFixed(1).replace(/\.0$/, "") + "B";
    if (num >= 1e6) return (num / 1e6).toFixed(1).replace(/\.0$/, "") + "M";
    if (num >= 1e3) return (num / 1e3).toFixed(1).replace(/\.0$/, "") + "K";
    return num.toString();
} */

import axios from "axios";

let handler = async (m, { conn, text, usedPrefix, command }) => {
  if (!text) {
    return conn.sendMessage(
      m.chat,
      {
        text:
          `🎧 *M U S I C  P L A Y*\n\n` +
          `🔎 Masukkan judul lagu!\n` +
          `📝 Contoh:\n${usedPrefix + command} Aku kamu dan samudra\n\n` +
          `🌐 Source: api.ilhm.my.id`,
      },
      { quoted: m }
    );
  }
  
  await global.loading(m, conn);

  const query = encodeURIComponent(text);
  let music = null;
  let platform = "";

  /* ================= SPOTIFY ================= */
  try {
    const spotify = await axios.get(
      `https://api.ilhm.my.id/download/spotifyplay?q=${query}`,
      {
        timeout: 30000,
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Mobile Safari/537.36",
        },
      }
    );

    if (spotify.data.status) {
      const r = spotify.data.result;
      music = {
        title: r.title,
        artist: r.artist,
        duration: r.duration,
        cover: r.cover,
        url: r.url,
        download: r.download,
      };
      platform = "Spotify";
    }
  } catch {
    // lanjut fallback
  }

  /* ================= YOUTUBE FALLBACK ================= */
  if (!music) {
    try {
      const yt = await axios.get(
        `https://api.ilhm.my.id/download/play?q=${query}`,
        {
          timeout: 30000,
          headers: {
            "User-Agent":
              "Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Mobile Safari/537.36",
          },
        }
      );

      if (!yt.data.status) throw "Fallback gagal";

      const r = yt.data.result;
      music = {
        title: r.title,
        artist: r.channel,
        duration: r.duration,
        cover: r.thumbnail,
        url: r.url,
        download: r.download_url,
      };
      platform = "YouTube";
    } catch (e) {
      return conn.sendMessage(
        m.chat,
        {
          text: `❌ *Gagal memutar lagu*\n🌐 Source: api.ilhm.my.id`,
        },
        { quoted: m }
      );
    }
  }

  /* ================= LYRICS ================= */
  let lyricsText = "❌ Lirik tidak ditemukan.";
  try {
    const lyrics = await axios.get(
      `https://api.ilhm.my.id/search/lyrics?q=${query}`,
      {
        timeout: 20000,
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Mobile Safari/537.36",
        },
      }
    );

    if (lyrics.data.status && lyrics.data.result?.lyrics?.length) {
      lyricsText = lyrics.data.result.lyrics.join("\n");
    }
  } catch {
    // optional
  }

  /* ================= MESSAGE ================= */
  let caption = `🎧 *M U S I C  P L A Y*\n`;
  caption += `━━━━━━━━━━━━━━━━━━━\n`;
  caption += `🎵 *Judul*   : ${music.title}\n`;
  caption += `🎤 *Artis*   : ${music.artist}\n`;
  caption += `⏱️ *Durasi*  : ${music.duration}\n`;
  caption += `📡 *Platform*: ${platform}\n`;
  caption += `🌐 *Source*  : api.ilhm.my.id\n`;
  caption += `━━━━━━━━━━━━━━━━━━━\n`;
  caption += `🔗 Link : ${music.url}\n\n`;
  caption += `📜 *L I R I K*\n`;
  caption += `━━━━━━━━━━━━━━━━━━━\n`;
  caption += lyricsText;

  // 🖼️ cover + caption
  await conn.sendMessage(
    m.chat,
    {
      image: { url: music.cover },
      caption: caption.trim(),
    },
    { quoted: m }
  );

  // 🎶 audio
  await conn.sendMessage(
    m.chat,
    {
      audio: { url: music.download },
      mimetype: "audio/mpeg",
      fileName: `${music.title}.mp3`,
    },
    { quoted: m }
  );
};

handler.help = ["play <judul lagu>"];
handler.tags = ["music", "downloader"];
handler.command = /^(play|music|song|spotify|ytplay|lyrics|lirik)$/i;

export default handler;