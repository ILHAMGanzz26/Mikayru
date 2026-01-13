import fs from "fs"
import fetch from "node-fetch"
import FormData from "form-data"
import path from "path"

const BASE = "https://ilhm.my.id"

let handler = async (m, { conn, text, usedPrefix, command }) => {
  let theme = text || "Hitam putih"

  // ambil media (reply > current)
  let q = m.quoted ? m.quoted : m
  let mime = (q.msg || q).mimetype || q.mediaType || ""

  if (!/image/.test(mime)) {
    return m.reply(
      `✳️ Cara pakai:\n` +
      `Reply gambar dengan:\n` +
      `${usedPrefix + command} Hitam putih`
    )
  }

  let prosesMsg = await m.reply("⏳ Memproses canvas warna...")

  try {
    // download media
    let media = await q.download?.()
    if (!media) media = await conn.downloadMediaMessage(q)
    if (!media || !Buffer.isBuffer(media)) throw new Error("Gagal download gambar")

    // simpan sementara
    let ext = mime.split("/")[1] || "jpg"
    let tmpFile = path.join(".", `warna_${Date.now()}.${ext}`)
    fs.writeFileSync(tmpFile, media)

    // upload ke ilhm.my.id
    let form = new FormData()
    form.append("file", fs.createReadStream(tmpFile))

    let res = await fetch(`${BASE}/api/upload/`, {
      method: "POST",
      body: form,
      headers: form.getHeaders()
    })

    let raw = await res.text()
    let data = {}
    try { data = JSON.parse(raw) } catch { data = { raw } }

    try { fs.unlinkSync(tmpFile) } catch {}

    // ambil URL hasil upload
    let imageUrl =
      data.url ? (data.url.startsWith("http") ? data.url : BASE + data.url) :
      data.storedName ? `${BASE}/uploads/${data.storedName}` :
      data.filename ? `${BASE}/uploads/Image/${data.filename}` :
      null

    if (!imageUrl) {
      throw new Error("Upload berhasil tapi URL tidak ditemukan")
    }

    // API canvas warna (langsung gambar)
    let apiUrl =
      "https://zelapioffciall.koyeb.app/canvas/warna?" +
      `url=${encodeURIComponent(imageUrl)}&theme=${encodeURIComponent(theme)}`

    await conn.sendMessage(
      m.chat,
      {
        image: { url: apiUrl },
        caption: `🎨 *Canvas Warna*\nTema: *${theme}*`
      },
      { quoted: prosesMsg }
    )

  } catch (e) {
    console.error(e)
    await conn.sendMessage(
      m.chat,
      { text: `❌ Gagal memproses canvas warna.\n${e.message}` },
      { quoted: prosesMsg }
    )
  }
}

handler.help = ["warna <tema>"]
handler.tags = ["tools", "image"]
handler.command = /^warna$/i

export default handler