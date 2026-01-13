import fs from "fs"
import fetch from "node-fetch"
import FormData from "form-data"
import path from "path"

const BASE = "https://ilhm.my.id"

async function uploadIlhm(buffer, mime) {
  let ext = mime.split("/")[1] || "jpg"
  let filePath = path.join(".", `tmp_${Date.now()}.${ext}`)
  fs.writeFileSync(filePath, buffer)

  let form = new FormData()
  form.append("file", fs.createReadStream(filePath))

  let res = await fetch(`${BASE}/api/upload/`, {
    method: "POST",
    body: form,
    headers: form.getHeaders()
  })

  let text = await res.text()
  let data = {}
  try { data = JSON.parse(text) } catch {}

  try { fs.unlinkSync(filePath) } catch {}

  let url =
    data.url ? (data.url.startsWith("http") ? data.url : BASE + data.url) :
    data.storedName ? `${BASE}/uploads/${data.storedName}` :
    data.originalName ? `${BASE}/uploads/${data.originalName}` :
    data.filename ? `${BASE}/uploads/Image/${data.filename}` :
    null

  if (!url) throw new Error("URL upload tidak ditemukan")

  return url
}

let handler = async (m, { conn }) => {
  let q = m.quoted ? m.quoted : m
  let mime = (q.msg || q).mimetype || ""

  if (!/image/.test(mime))
    throw "❌ Reply / kirim gambar"

  let proses = await m.reply("⏳ Processing HD...")

  try {
    let media = await q.download()
    if (!media) throw new Error("Gagal download gambar")

    let imageUrl = await uploadIlhm(media, mime)

    let api = `https://api.ilhm.my.id/tools/hd?url=${encodeURIComponent(imageUrl)}`

    let res = await fetch(api, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Mobile Safari/537.36"
      }
    })

    if (!res.ok)
      throw new Error(`HD API error ${res.status}`)

    let buffer = await res.buffer()

    await conn.sendMessage(
      m.chat,
      {
        image: buffer,
        mimetype: "image/jpeg",
        caption: "✅ HD Image\n> Source: api.ilhm.my.id"
      },
      { quoted: proses }
    )

  } catch (e) {
    await conn.sendMessage(
      m.chat,
      { text: `❌ Gagal memproses HD image\n${e.message}` },
      { quoted: proses }
    )
  }
}

handler.help = ["hd"]
handler.tags = ["tools"]
handler.command = /^(hd|remini)$/i

export default handler