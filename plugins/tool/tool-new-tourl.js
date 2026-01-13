import fs from "fs"
import fetch from "node-fetch"
import FormData from "form-data"
import path from "path"

const BASE = "https://ilhm.my.id" // domain baru

let handler = async (m, { conn }) => {
  // Ambil pesan media: prioritas quoted → current
  let q = m.quoted ? m.quoted : m
  let mime = (q.msg || q).mimetype || q.mediaType || ""

  if (!mime) return m.reply("📌 Kirim atau reply media dengan caption *.tourl*")

  let prosesMsg = await m.reply("⏳ Mengupload ke ilhm.my.id ...")

  try {
    // Download media (coba dua cara)
    let media = await q.download?.()
    if (!media) {
      try {
        media = await conn.downloadMediaMessage(q)
      } catch {
        throw new Error("Gagal download media (reply tidak terdeteksi).")
      }
    }

    if (!media || !Buffer.isBuffer(media))
      throw new Error("Gagal mengambil data media.")

    // simpan temporer
    let ext = mime.split("/")[1] || "bin"
    let filePath = path.join(".", `upload_${Date.now()}.${ext}`)
    fs.writeFileSync(filePath, media)

    // prepare form-data
    let form = new FormData()
    form.append("file", fs.createReadStream(filePath))

    // POST ke endpoint baru
    let res = await fetch(`${BASE}/api/upload/`, {
      method: "POST",
      body: form,
      headers: form.getHeaders(),
    })

    let text = await res.text().catch(() => "")
    let data = {}
    try {
      data = text ? JSON.parse(text) : {}
    } catch {
      data = { raw: text }
    }

    try { fs.unlinkSync(filePath) } catch {}

    // ambil URL dari response
    let url = null

    if (data.url && typeof data.url === "string") {
      url = data.url.startsWith("http") ? data.url : (BASE + data.url)
    }

    if (!url && data.storedName) {
      url = `${BASE}/uploads/${data.storedName}`
    }

    if (!url && data.originalName) {
      url = `${BASE}/uploads/${data.originalName}`
    }

    if (!url && data.filename) {
      url = `${BASE}/uploads/Image/${data.filename}`
    }

    if (!url) {
      await conn.sendMessage(
        m.chat,
        { text: `❌ Response tidak berisi URL.\nStatus: ${res.status}\nResponse:\n${JSON.stringify(data, null, 2)}` },
        { quoted: prosesMsg }
      )
      return
    }

    if (mime.startsWith("image/")) {
      await conn.sendMessage(
        m.chat,
        { image: { url }, caption: `✅ Berhasil Upload!\n📎 URL: ${url}` },
        { quoted: prosesMsg }
      )
    } else {
      await conn.sendMessage(
        m.chat,
        { text: `✅ Berhasil Upload!\n📎 URL: ${url}` },
        { quoted: prosesMsg }
      )
    }

  } catch (e) {
    console.error(e)
    await conn.sendMessage(
      m.chat,
      { text: `❌ Terjadi kesalahan:\n${e.message}` },
      { quoted: prosesMsg }
    )
  }
}

handler.help = ["tourl"]
handler.tags = ["tools"]
handler.command = /^tourl$/i

export default handler