import axios from "axios"

const fetchWithTimeout = (url, timeout = 15000) =>
  axios.get(url, { timeout })

let handler = async (m, { conn, text, usedPrefix, command }) => {
  try {
    if (!text)
      return m.reply(
        `🍙 Masukkan URL TikTok!\nContoh:\n${usedPrefix + command} https://vt.tiktok.com/xxxx`
      )

    if (!/(tiktok\.com|vt\.tiktok\.com|vm\.tiktok\.com)/i.test(text))
      return m.reply("❌ URL TikTok tidak valid!")

    let data = null

    /* ================= API FALLBACK ================= */
    const apis = [
      /* Nekolabs */
      async () => {
        const r = await fetchWithTimeout(
          `https://api.nekolabs.web.id/downloader/tiktok?url=${encodeURIComponent(text)}`
        )
        const d = r.data?.result
        if (!d) return null
        return {
          title: d.title,
          video: d.video,
          images: d.images,
          cover: d.cover,
          music: d.music_info?.url,
          author: d.author?.name,
          stats: d.stats
        }
      },

      /* Zenzxz */
      async () => {
        const r = await fetchWithTimeout(
          `https://api.zenzxz.my.id/api/downloader/tiktok?url=${encodeURIComponent(text)}`
        )
        if (!r.data?.success) return null
        const d = r.data.data
        return {
          title: d.title,
          video: d.hdplay || d.play,
          images: d.images, // kalau ada photomode
          cover: d.cover,
          music: d.music,
          author: d.author?.nickname,
          stats: {
            like: d.digg_count,
            comment: d.comment_count,
            share: d.share_count
          }
        }
      },

      /* Elrayy */
      async () => {
        const r = await fetchWithTimeout(
          `https://api.elrayyxml.web.id/api/downloader/tiktok?url=${encodeURIComponent(text)}`
        )
        if (!r.data?.status) return null
        const d = r.data.result
        return {
          title: d.title,
          video: d.data,
          cover: d.cover,
          music: d.music_info?.url,
          author: d.author?.nickname,
          stats: d.stats
        }
      },

      /* Anabot */
      async () => {
        const r = await fetchWithTimeout(
          `https://anabot.my.id/api/download/tiktok?url=${encodeURIComponent(text)}&apikey=freeApikey`
        )
        if (!r.data?.success) return null
        const d = r.data.data.result
        return {
          title: d.description,
          video: d.video || d.nowatermark,
          images: d.image,
          cover: d.thumbnail,
          music: d.audio,
          author: d.username
        }
      }
    ]

    /* ================= EXECUTE API ================= */
    for (let api of apis) {
      try {
        data = await api()
        if (data?.images?.length || data?.video) break
      } catch {}
    }

    if (!data)
      return m.reply("❌ Semua API gagal mengambil data TikTok!")

    /* ================= CAPTION ================= */
    const caption = ` \`🎬 TikTok Downloader\`

📜 Judul: ${data.title || "-"}
👤 Author: ${data.author || "-"}
❤️ Like: ${data.stats?.like || "-"}
💬 Comment: ${data.stats?.comment || "-"}
🔁 Share: ${data.stats?.share || "-"}
`

    /* ================= PHOTO MODE ================= */
    if (Array.isArray(data.images) && data.images.length > 0) {
      m.reply("📸 *Mode Foto terdeteksi!*")

      for (let i = 0; i < data.images.length; i++) {
        await conn.sendMessage(
          m.chat,
          {
            image: { url: data.images[i] },
            caption: i === 0 ? caption : ""
          },
          { quoted: m }
        )
      }

      // kirim audio SETELAH foto
      if (data.music) {
        await conn.sendMessage(
          m.chat,
          {
            audio: { url: data.music },
            mimetype: "audio/mpeg",
            ptt: false
          },
          { quoted: m }
        )
      }

      return // ⛔ STOP, JANGAN KIRIM VIDEO
    }

    /* ================= VIDEO MODE ================= */
    if (data.video) {
      await conn.sendMessage(
        m.chat,
        {
          video: { url: data.video },
          caption,
          mimetype: "video/mp4"
        },
        { quoted: m }
      )

      if (data.music) {
        await conn.sendMessage(
          m.chat,
          {
            audio: { url: data.music },
            mimetype: "audio/mpeg",
            ptt: false
          },
          { quoted: m }
        )
      }
    }

  } catch (e) {
    console.error(e)
    m.reply("⚠️ Terjadi kesalahan saat download TikTok!")
  }
}

handler.help = ["tiktok", "tt"]
handler.tags = ["downloader"]
handler.command = /^(tiktok|tt)$/i

export default handler