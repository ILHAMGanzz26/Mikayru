import axios from "axios"
import { Sticker } from "wa-sticker-formatter"

let handler = async (m, { conn, text, usedPrefix, command }) => {
  try {
    if (!text) {
      return conn.sendMessage(
        m.chat,
        {
          text:
            `🔥 *Masukkan 3 teks untuk Roast!*\n\n` +
            `✳️ Contoh:\n` +
            `${usedPrefix + command} Owner si|ILHAM|Ganteng Bener Jir`
        },
        { quoted: m }
      )
    }

    let [text1, text2, text3] = text.split("|").map(v => v?.trim())
    if (!text1 || !text2 || !text3) {
      return conn.sendMessage(
        m.chat,
        {
          text:
            `❌ Format salah!\n` +
            `Gunakan tanda |\n` +
            `Contoh:\n${usedPrefix + command} Owner si|ILHAM|Ganteng Bener Jir`
        },
        { quoted: m }
      )
    }

    let api =
      "https://zelapioffciall.koyeb.app/canvas/roast?" +
      `text1=${encodeURIComponent(text1)}` +
      `&text2=${encodeURIComponent(text2)}` +
      `&text3=${encodeURIComponent(text3)}`

    m.reply("🔥 Membuat roast...")

    /* 1️⃣ KIRIM GAMBAR DULU */
    await conn.sendMessage(
      m.chat,
      {
        image: { url: api },
        caption: "🔥 *Roast Canvas*"
      },
      { quoted: m }
    )

    /* 2️⃣ AMBIL BUFFER GAMBAR */
    let res = await axios.get(api, { responseType: "arraybuffer" })

    /* 3️⃣ BUAT STICKER */
    let sticker = new Sticker(res.data, {
      pack: global.config?.stickpack || "IlhAm Project",
      author: global.config?.stickauth || "Canvas Roast",
      type: "full",
      quality: 100
    })

    /* 4️⃣ KIRIM STICKER */
    await conn.sendMessage(
      m.chat,
      { sticker: await sticker.toBuffer() },
      { quoted: m }
    )

  } catch (err) {
    console.error(err)
    await conn.sendMessage(
      m.chat,
      { text: `❌ Gagal membuat roast.\n${err.message}` },
      { quoted: m }
    )
  }
}

handler.help = ["roast <text1>|<text2>|<text3>"]
handler.tags = ["maker"]
handler.command = /^roast$/i

export default handler