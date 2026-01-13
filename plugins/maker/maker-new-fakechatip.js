import axios from "axios"

let handler = async (m, { conn, text, usedPrefix, command }) => {
  if (!text)
    return m.reply(
      `🍙 *Masukkan format yang benar!*\n\nContoh:\n${usedPrefix + command} Malas Menanggapi 🗿|12.23|15.88\n\n📌 Format:\ntext|chatime|statusbartime`
    )

  try {
    await global.loading(m, conn)

    // 🎯 Ambil parameter
    let [teks, chatime, statusbartime] = text.split("|")
    if (!teks) return m.reply("⚠️ *Teks tidak boleh kosong!*")
    if (!chatime) chatime = "12.00"
    if (!statusbartime) statusbartime = "12.00"

    // 🔗 URL API kamu
    const apiUrl = `https://ilham-api.vercel.app/api/maker/fakechatip?text=${encodeURIComponent(
      teks
    )}&chatime=${encodeURIComponent(chatime)}&statusbartime=${encodeURIComponent(statusbartime)}`

    // 📦 Ambil gambar langsung sebagai buffer
    const res = await axios.get(apiUrl, { responseType: "arraybuffer" })

    // 🖼️ Kirim hasil ke chat
    await conn.sendMessage(
      m.chat,
      {
        image: Buffer.from(res.data),
        caption: `💬 *Fake Chat iPhone*\n🕒 Chat: ${chatime}\n📱 StatusBar: ${statusbartime}`
      },
      { quoted: m }
    )
  } catch (e) {
    console.error(e)
    m.reply("🥪 *Terjadi kesalahan saat membuat fake chat iPhone.*")
  } finally {
    await global.loading(m, conn, true)
  }
}

handler.help = ["fakechatip", "fakechat", "iqc"]
handler.tags = ["maker"]
handler.command = /^fakechatip|fakechat|iqc$/i

export default handler