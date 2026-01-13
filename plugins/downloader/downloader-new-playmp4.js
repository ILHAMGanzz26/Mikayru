import axios from "axios"
import fs from "fs"
import path from "path"

let handler = async (m, { conn, text, usedPrefix, command }) => {
  if (!text)
    return m.reply(`Contoh:\n${usedPrefix + command} https://youtube.com/watch?v=xxxx`)

  const tmpDir = "./tmp"
  if (!fs.existsSync(tmpDir)) fs.mkdirSync(tmpDir)

  try {
    await m.reply("⏳ Mengambil data video...")

    const encoded = encodeURIComponent(text.trim())
    const endpoints = [
      `https://api.nekolabs.web.id/downloader/youtube/v1?url=${encoded}&format=720`,
      `https://api-faa.my.id/faa/ytmp4?url=${encoded}`,
      `https://api.kyyokatsu.my.id/api/downloader/ytmp4?url=${encoded}`,
      `https://api.rikishop.my.id/download/ytmp4?url=${encoded}`,
    ]

    let downloadUrl = null

    // 🔁 fallback API
    for (const endpoint of endpoints) {
      try {
        const { data } = await axios.get(endpoint, {
          timeout: 15000,
          headers: {
            "User-Agent": "Mozilla/5.0",
            "Accept": "application/json"
          }
        })

        if (!data || (!data.success && !data.status)) continue

        const result = data.result || data.data || {}

        const url =
          result.downloadUrl ||
          result.download_url ||
          result.mp4 ||
          result.url

        const isVideo =
          result.type === "video" ||
          result.format === "mp4" ||
          result.mp4 ||
          result.url

        if (url && isVideo) {
          downloadUrl = url
          break
        }
      } catch {
        continue
      }
    }

    if (!downloadUrl)
      throw "Semua API gagal mengambil video"

    const filePath = path.join(tmpDir, `${Date.now()}.mp4`)

    // ⬇️ download ke tmp
    const response = await axios.get(downloadUrl, {
      responseType: "stream",
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Linux; Android 10) AppleWebKit/537.36 Chrome Mobile Safari/537.36",
        "Referer": "https://www.youtube.com"
      }
    })

    await new Promise((resolve, reject) => {
      const stream = fs.createWriteStream(filePath)
      response.data.pipe(stream)
      stream.on("finish", resolve)
      stream.on("error", reject)
    })

    // 🎥 KIRIM SEBAGAI VIDEO
    await conn.sendMessage(
      m.chat,
      {
        video: fs.readFileSync(filePath),
        mimetype: "video/mp4",
        caption: "🎬 YouTube Video"
      },
      { quoted: m }
    )

    fs.unlinkSync(filePath)

  } catch (err) {
    console.error(err)
    m.reply(
      `❌ Terjadi kesalahan saat mengambil video!\n\n🧁 Detail:\n${err}`
    )
  }
}

handler.help = ["ytmp4"]
handler.tags = ["downloader"]
handler.command = /^(yt|youtube|ytmp4|ytv)$/i

export default handler