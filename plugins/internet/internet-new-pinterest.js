import axios from 'axios'

let handler = async (m, { conn, text, usedPrefix, command }) => {
  if (!text) {
    return m.reply(`📌 Contoh penggunaan:\n${usedPrefix + command} fuji`)
  }

  try {
    await m.reply('⏳ Sedang mencari gambar di Pinterest...')

    const query = encodeURIComponent(text)
    const url = `https://api.ilhm.my.id/search/pinterest?q=${query}`

    const res = await axios.get(url, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Mobile Safari/537.36'
      }
    })

    const data = res.data

    // Validasi format data
    if (!data.status || !Array.isArray(data.result)) {
      return m.reply('❌ Format data tidak sesuai.')
    }

    const images = data.result
      .filter(v => v.directLink)
      .map(v => v.directLink)

    if (!images.length) {
      return m.reply('❌ Tidak ada gambar yang ditemukan.')
    }

    // Notifikasi hasil (rapi & estetik)
    const info = `
📌 Pinterest Search Result

🔍 Kata kunci  : ${text}
🖼️ Total gambar: ${images.length}

📤 Mengirim semua gambar...
`.trim()

    await m.reply(info)

    // Kirim SEMUA gambar
    for (const img of images) {
      await conn.sendMessage(
        m.chat,
        { image: { url: img } },
        { quoted: m }
      )
    }

  } catch (e) {
    console.error(e)
    m.reply('❌ Terjadi kesalahan saat mengambil data.\nCoba lagi nanti.')
  }
}

handler.help = ['pinterest <query>']
handler.tags = ['internet']
handler.command = /^(pinterest|pin)$/i

export default handler