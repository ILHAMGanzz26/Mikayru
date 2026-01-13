import axios from "axios"
import fs from "fs"

function formatDuration(seconds) {
  const min = Math.floor(seconds / 60)
  const sec = seconds % 60
  return `${min}:${sec.toString().padStart(2, "0")}`
}

// Fungsi helper untuk timeout
const withTimeout = (promise, ms) =>
  Promise.race([promise, new Promise((_, reject) => setTimeout(() => reject(new Error("Timeout")), ms))])

// List API ytplay / yt mp3
const APIS = [
  async (query) => {
    const { data } = await axios.get(`https://ftaka.qzz.io/play?query=${encodeURIComponent(query)}`, { timeout: 20000 })
    if (!data?.status || !data?.audio_url) throw new Error("API ftaka gagal")
    return {
      title: data.title,
      duration: parseInt(data.duration),
      thumbnail: data.thumbnail,
      url: data.audio_url,
      mediaUrl: null,
    }
  },
  async (query) => {
    const { data } = await axios.get(`https://api.deline.web.id/downloader/ytplay?q=${encodeURIComponent(query)}`, { timeout: 20000 })
    if (!data?.status || !data?.result?.dlink) throw new Error("API deline gagal")
    return {
      title: data.result.title,
      duration: 0,
      thumbnail: data.result.thumbnail,
      url: data.result.dlink,
      mediaUrl: data.result.url,
    }
  },
  async (query) => {
    const { data } = await axios.get(`https://anabot.my.id/api/download/playmusic?query=${encodeURIComponent(query)}&apikey=freeApikey`, { timeout: 20000 })
    if (!data?.success || !data?.data?.result?.urls) throw new Error("API anabot gagal")
    const r = data.data.result
    return {
      title: r.metadata.title,
      duration: 0,
      thumbnail: r.metadata.thumbnail,
      url: r.urls,
      mediaUrl: r.metadata.webpage_url,
    }
  },
  async (query) => {
    const { data } = await axios.get(`https://api.elrayyxml.web.id/api/downloader/ytplay?q=${encodeURIComponent(query)}`, { timeout: 20000 })
    if (!data?.status || !data?.result?.download_url) throw new Error("API elrayyxml gagal")
    const r = data.result
    return {
      title: r.title,
      duration: r.seconds,
      thumbnail: r.thumbnail,
      url: r.download_url,
      mediaUrl: r.url,
    }
  },
  async (query) => {
    const { data } = await axios.get(`https://api.ootaizumi.web.id/downloader/youtube-play?query=${encodeURIComponent(query)}`, { timeout: 20000 })
    if (!data?.status || !data?.result?.download) throw new Error("API ootaizumi gagal")
    const r = data.result
    return {
      title: r.title,
      duration: r.metadata.duration,
      thumbnail: r.thumbnail,
      url: r.download,
      mediaUrl: r.url,
    }
  },
  async (query) => {
    const { data } = await axios.get(`https://api.zenzxz.my.id/api/search/play?query=${encodeURIComponent(query)}`, { timeout: 20000 })
    if (!data?.success || !data?.data?.dl_mp3) throw new Error("API zenzxz gagal")
    const r = data.data
    return {
      title: r.metadata.title,
      duration: r.metadata.duration,
      thumbnail: r.metadata.thumbnail,
      url: r.dl_mp3,
      mediaUrl: null,
    }
  },
  async (query) => {
    const { data } = await axios.get(`https://api.nekolabs.web.id/downloader/youtube/play/v1?q=${encodeURIComponent(query)}`, { timeout: 20000 })
    if (!data?.success || !data?.result?.downloadUrl) throw new Error("API nekolabs gagal")
    const r = data.result
    return {
      title: r.metadata.title,
      duration: r.metadata.duration,
      thumbnail: r.metadata.cover,
      url: r.downloadUrl,
      mediaUrl: r.metadata.url,
    }
  },
]

let handler = async (m, { conn, args }) => {
  if (!args[0])
    return m.reply(
      "🍙 *Masukkan judul atau link YouTube!*\nContoh:\n.ytplay Slay"
    )

  const query = args.join(" ")

  try {
    await global.loading(m, conn)

    let result = null

    // 🔥 Race paralel dengan timeout 10 detik
    try {
      const race = APIS.map(api => withTimeout(api(query).catch(() => null), 10000))
      result = await Promise.any(race)
    } catch {
      result = null
    }

    // 🔁 Fallback retry per API dengan timeout total 30 detik
    if (!result) {
      const start = Date.now()
      for (const api of APIS) {
        if (Date.now() - start > 30000) break
        try {
          result = await withTimeout(api(query).catch(() => null), 8000)
          if (result) break
        } catch (e) {
          console.warn(e.message)
        }
      }
    }

    if (!result) return m.reply("❌ Semua API gagal atau jaringan bermasalah.")

    // Ambil thumbnail
    let thumbBuffer = null
    try {
      const thumbRes = await axios.get(result.thumbnail, { responseType: "arraybuffer" })
      thumbBuffer = Buffer.from(thumbRes.data)
    } catch {
      if (fs.existsSync("./thumbnail.jpg"))
        thumbBuffer = fs.readFileSync("./thumbnail.jpg")
    }

    // Kirim audio
    await conn.sendMessage(
      m.chat,
      {
        audio: { url: result.url },
        mimetype: "audio/mpeg",
        ptt: false,
        contextInfo: {
          externalAdReply: {
            title: result.title,
            body: result.duration ? `Durasi: ${formatDuration(result.duration)}` : undefined,
            thumbnail: thumbBuffer,
            mediaUrl: result.mediaUrl,
            mediaType: 2,
            renderLargerThumbnail: true,
          },
        },
      },
      { quoted: m }
    )

  } catch (e) {
    console.error(e)
    return m.reply("🥪 *Gagal memproses permintaan, coba lagi beberapa saat.*")
  } finally {
    await global.loading(m, conn, true)
  }
}

handler.help = ["ytmp3 <judul>"]
handler.tags = ["downloader"]
handler.command = /^(ytmp3|yta)$/i

export default handler