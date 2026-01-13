import fs from "fs"
import fetch from "node-fetch"
import FormData from "form-data"
import { Sticker } from "wa-sticker-formatter"

const BASE = "https://ilhm.my.id"

let handler = async (m, { conn, text }) => {
  if (!text)
    return m.reply(
      "Format:\n" +
      ".meme atas\n" +
      ".meme |bawah\n" +
      ".meme atas|bawah\n\n" +
      "Reply gambar"
    )

  // ===== LOGIC FINAL =====
  let textT = ""
  let textB = ""

  if (text.includes("|")) {
    let split = text.split("|")
    textT = split[0].trim()
    textB = split[1].trim()
  } else {
    textT = text.trim()
  }

  if (!textT && !textB)
    return m.reply("❌ Teks tidak boleh kosong")

  // ===== AMBIL GAMBAR =====
  let q = m.quoted ? m.quoted : m
  let mime = (q.msg || q).mimetype || q.mediaType || ""

  if (!mime || !mime.startsWith("image/"))
    return m.reply("Reply / kirim gambar")

  let prosesMsg = await global.loading(m, conn);

  try {
    // download
    let media = await q.download?.() || await conn.downloadMediaMessage(q)
    if (!media) throw new Error("Gagal download gambar")

    let ext = mime.split("/")[1]
    let filePath = `./meme_${Date.now()}.${ext}`
    fs.writeFileSync(filePath, media)

    // upload ilhm.my.id
    let form = new FormData()
    form.append("file", fs.createReadStream(filePath))

    let res = await fetch(`${BASE}/api/upload/`, {
      method: "POST",
      body: form,
      headers: form.getHeaders()
    })

    let data = await res.json().catch(() => ({}))
    fs.unlinkSync(filePath)

    let imageUrl =
      data.url ? (data.url.startsWith("http") ? data.url : BASE + data.url) :
      data.storedName ? `${BASE}/uploads/${data.storedName}` :
      data.originalName ? `${BASE}/uploads/${data.originalName}` :
      null

    if (!imageUrl) throw new Error("URL upload tidak ditemukan")

    // ===== FALLBACK API =====
    let apis = [
      `https://api.nekolabs.web.id/cnv/meme?imageUrl=${encodeURIComponent(imageUrl)}&textT=${encodeURIComponent(textT)}&textB=${encodeURIComponent(textB)}`,
      `https://zelapioffciall.koyeb.app/canvas/meme?url=${encodeURIComponent(imageUrl)}&top=${encodeURIComponent(textT)}&bottom=${encodeURIComponent(textB)}`,
      `https://api.deline.web.id/maker/smeme?image=${encodeURIComponent(imageUrl)}&top=${encodeURIComponent(textT)}&bottom=${encodeURIComponent(textB)}`,
      `https://anabot.my.id/api/maker/smeme?imageUrl=${encodeURIComponent(imageUrl)}&text1=${encodeURIComponent(textT)}&text2=${encodeURIComponent(textB)}&apikey=freeApikey`
    ]

    let memeUrl = null

    for (let api of apis) {
      try {
        let r = await fetch(api, { method: "HEAD" })
        if (r.ok) {
          memeUrl = api
          break
        }
      } catch {}
    }

    if (!memeUrl) throw new Error("Semua API meme gagal")

    // ===== STICKER =====
    let sticker = new Sticker(memeUrl, {
      pack: "𝙄𝙇𝙃𝘼𝙈 𝘼.",
      author: "© 𝙈͢𝙞𝙠𝙖𝙮𝙧𝙪 𝘽͢𝙤𝙩𝙯",
      type: "full",
      quality: 80
    })

    await conn.sendMessage(
      m.chat,
      await sticker.toMessage(),
      { quoted: prosesMsg }
    )

  } catch (e) {
    console.error(e)
    m.reply("❌ Gagal membuat sticker:\n" + e.message)
  }
}

handler.help = ["meme atas|bawah (reply gambar)"]
handler.tags = ["sticker", "maker"]
handler.command = /^meme|smeme$/i

export default handler