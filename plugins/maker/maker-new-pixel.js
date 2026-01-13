import fetch from "node-fetch"
import fs from "fs"
import FormData from "form-data"

let handler = async (m, { conn, usedPrefix, command }) => {
  let q = m.quoted ? m.quoted : m
  let mime = (q.msg || q).mimetype || ""

  if (!mime) return m.reply(`🖼️ *Reply atau kirim gambar dengan caption* ${usedPrefix + command}`)
  if (!/image/.test(mime)) return m.reply("⚠️ File yang direply bukan gambar!")

  await conn.sendMessage(m.chat, { react: { text: "⏳", key: m.key } })

  try {
    // download media
    let media = await q.download?.()
    let filePath = `./tmp/${Date.now()}.jpg`
    fs.writeFileSync(filePath, media)

    // upload ke tmpfiles.org
    let form = new FormData()
    form.append("file", fs.createReadStream(filePath))
    let upload = await fetch("https://tmpfiles.org/api/v1/upload", {
      method: "POST",
      body: form,
    })
    let uploadRes = await upload.json()

    if (!uploadRes?.data?.url) throw new Error("Gagal upload ke tmpfiles.org")
    let imageUrl = uploadRes.data.url.replace("/tmpfiles.org/", "/tmpfiles.org/dl/")

    // panggil API pixelate
    let apiUrl = `https://api.nekolabs.web.id/tools/convert/topixelated?imageUrl=${encodeURIComponent(imageUrl)}`
    let res = await fetch(apiUrl)
    let json = await res.json()

    if (!json.success || !json.result) throw new Error("Gagal convert gambar dari API.")

    let resultUrl = json.result

    await conn.sendMessage(
      m.chat,
      {
        image: { url: resultUrl },
        caption: "🟪 *Berhasil diubah menjadi pixelated!*",
      },
      { quoted: m }
    )

    await conn.sendMessage(m.chat, { react: { text: "✅", key: m.key } })
    fs.unlinkSync(filePath)
  } catch (e) {
    console.error("Pixelate Error:", e)
    await conn.sendMessage(m.chat, {
      text: `❌ *Terjadi kesalahan saat memproses gambar:*\n\n${e.message || e}`,
    })
    await conn.sendMessage(m.chat, { react: { text: "❌", key: m.key } })
  }
}

handler.help = ["pixel", "pixelate", "topixelated"]
handler.tags = ["maker"]
handler.command = /^(pixel|pixelate|topixelated)$/i

export default handler