import fetch from "node-fetch"

const API_LIST = [
  {
    name: "Chocomilk",
    url: ig =>
      `https://chocomilk.amira.us.kg/v1/download/instagram?url=${encodeURIComponent(ig)}`,
    parse: json => {
      if (!json.success) return null
      let d = json.data
      let caption = `📸 Instagram Post\n\n${d.title ? `• Judul: ${d.title}\n` : ''}${d.author?.username ? `• Author: ${d.author.username}\n` : ''}${d.views ? `• Views: ${d.views}\n` : ''}${d.likes ? `• Likes: ${d.likes}` : ''}`
      return {
        videos: d.media.videos?.map(v => v.url) || [],
        images: d.media.images?.map(i => i.url) || [],
        caption
      }
    }
  },
  {
    name: "ElrayyXml",
    url: ig =>
      `https://api.elrayyxml.web.id/api/downloader/instagram?url=${encodeURIComponent(ig)}`,
    parse: json => {
      if (!json.status) return null
      return {
        videos: json.result?.map(v => v.url) || [],
        images: [],
        caption: '📸 Instagram Post'
      }
    }
  },
  {
    name: "Anabot",
    url: ig =>
      `https://anabot.my.id/api/download/instagram?url=${encodeURIComponent(ig)}&apikey=freeApikey`,
    parse: json => {
      if (!json.success) return null
      return {
        videos: json.data.result?.map(v => v.url) || [],
        images: [],
        caption: '📸 Instagram Post'
      }
    }
  }
]

let handler = async (m, { conn, text, usedPrefix, command }) => {
  try {
    if (!text) return m.reply(`Contoh:\n${usedPrefix + command} https://www.instagram.com/p/...`)

    await conn.sendMessage(m.chat, { react: { text: "⏳", key: m.key } })

    let result = null

    // 🔁 fallback API
    for (let api of API_LIST) {
      try {
        let res = await fetch(api.url(text), { headers: { "User-Agent": "Mozilla/5.0" }, timeout: 15000 })
        let json = await res.json()
        let parsed = api.parse(json)
        if (parsed && (parsed.videos.length || parsed.images.length)) {
          result = parsed
          break
        }
      } catch {
        continue
      }
    }

    if (!result) throw "❌ Media tidak ditemukan"

    // 🎥 Video
    if (result.videos.length) {
      let r = await fetch(result.videos[0])
      let buf = Buffer.from(await r.arrayBuffer())
      await conn.sendMessage(m.chat, { video: buf, caption: result.caption }, { quoted: m })
      return
    }

    // 🖼 Images → album
    if (result.images.length) {
      let media = []
      for (let i = 0; i < result.images.length; i++) {
        let r = await fetch(result.images[i])
        let buf = Buffer.from(await r.arrayBuffer())
        media.push({ image: buf, caption: i === 0 ? result.caption : undefined })
      }

      // Pakai sendAlbumMessage() agar tidak error
      await conn.sendAlbumMessage(m.chat, media, { quoted: m })
      return
    }

  } catch (e) {
    m.reply(`*🍂 ERROR TERJADI*\n${e}`)
  } finally {
    await conn.sendMessage(m.chat, { react: { text: "", key: m.key } })
  }
}

handler.help = ["instagram", "ig", "igdl"]
handler.tags = ["downloader"]
handler.command = /^(instagram|ig|igdl)$/i

export default handler