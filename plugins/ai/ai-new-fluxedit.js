import fs from "fs"
import fetch from "node-fetch"
import FormData from "form-data"
import path from "path"

const BASE = "https://ilhm.my.id"

let handler = async (m, { conn, text }) => {
  let q = m.quoted ? m.quoted : m
  let mime = (q.msg || q).mimetype || q.mediaType || ""

  if (!mime.startsWith("image/"))
    return m.reply("Reply/kirim gambar dengan caption:\n.fluxedit <prompt>")

  if (!text)
    return m.reply("Prompt tidak boleh kosong")

  await global.loading(m, conn)
  let wait = await m.reply("Processing...")

  try {
    // download image
    let media = await q.download?.() || await conn.downloadMediaMessage(q)
    if (!Buffer.isBuffer(media)) throw "Gagal download gambar"

    // save temp file
    let ext = mime.split("/")[1] || "jpg"
    let filePath = path.join(".", `flux_${Date.now()}.${ext}`)
    fs.writeFileSync(filePath, media)

    // upload to ilhm.my.id
    let form = new FormData()
    form.append("file", fs.createReadStream(filePath))

    let upload = await fetch(`${BASE}/api/upload/`, {
      method: "POST",
      body: form,
      headers: form.getHeaders()
    })

    let uploadData = await upload.json()
    fs.unlinkSync(filePath)

    let imageUrl =
      uploadData.url?.startsWith("http")
        ? uploadData.url
        : `${BASE}${uploadData.url || "/uploads/" + uploadData.storedName}`

    if (!imageUrl) throw "URL upload tidak ditemukan"

    // call Flux Edit API
    let apiUrl = `https://api.ilhm.my.id/ai/flux/edit?image=${encodeURIComponent(imageUrl)}&prompt=${encodeURIComponent(text)}`
    let res = await fetch(apiUrl)
    let json = await res.json()

    if (!json.status) throw "Flux edit gagal"

    // FINAL CAPTION (LOCKED)
    let caption =
`> *Source*  : api.ilhm.my.id`

    await conn.sendMessage(
      m.chat,
      {
        image: { url: json.result.url },
        caption
      },
      { quoted: wait }
    )

  } catch (e) {
    console.error(e)
    await conn.sendMessage(
      m.chat,
      { text: `Error:\n${e}` },
      { quoted: wait }
    )
  }
}

handler.help = ["fluxedit <prompt>"]
handler.tags = ["ai", "image"]
handler.command = /^(fluxedit)$/i

export default handler