import axios from "axios"
import FormData from "form-data"
import fs from "fs"
import path from "path"
import crypto from "crypto"

async function uploadVidey(filePath) {
  if (!filePath) throw new Error("File tidak ada")
  if (!fs.existsSync(filePath)) throw new Error("File tidak ditemukan")

  const form = new FormData()
  form.append("file", fs.createReadStream(filePath), {
    filename: path.basename(filePath),
    contentType: "video/mp4"
  })

  const res = await axios.post(
    "https://videy.co/api/upload?visitorId=" + crypto.randomUUID(),
    form,
    {
      headers: {
        ...form.getHeaders(),
        "User-Agent": "Mozilla/5.0 (Linux; Android 10)",
        origin: "https://videy.co",
        referer: "https://videy.co/",
        accept: "application/json"
      },
      maxBodyLength: Infinity,
      maxContentLength: Infinity
    }
  )

  return res.data
}

let handler = async (m, { conn }) => {
  let q = m.quoted ? m.quoted : m
  let mime = (q.msg || q).mimetype || ""

  if (!/video/.test(mime))
    throw "❌ Reply / kirim video yang mau diupload ke Videy"

  await m.reply("⏳ Uploading video ke Videy...")

  let media = await q.download()
  let filePath = `./tmp/${Date.now()}.mp4`

  fs.writeFileSync(filePath, media)

  try {
    let result = await uploadVidey(filePath)

    await m.reply(
      `✅ *Upload berhasil!*\n\n` +
      `🔗 Link:\n${result.link}`
    )
  } catch (e) {
    await m.reply("❌ Gagal upload video\n" + e.message)
  } finally {
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath)
  }
}

handler.help = ["videy"]
handler.tags = ["tools"]
handler.command = /^videy$/i

export default handler