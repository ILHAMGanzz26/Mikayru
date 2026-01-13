import fetch from "node-fetch"

const API = "https://api.ilhm.my.id/ai/flux/generate"

let handler = async (m, { conn, text }) => {
  if (!text) return m.reply("Masukkan prompt gambar\nContoh: .flux anime girl")
  
  await global.loading(m, conn)

  try {
    const url = `${API}?prompt=${encodeURIComponent(text)}`
    const res = await fetch(url)
    const json = await res.json()

    if (!json.status) throw "Gagal generate gambar"

    const img = json.result.url

    await conn.sendMessage(
      m.chat,
      {
        image: { url: img },
        caption:
`*Berhasil Membuat Gambar.*

\`Prompt\`  : ${json.result.prompt}
\`Creator\`  : ILHAM A. 

> Source : api.ilhm.my.id`
      },
      { quoted: m }
    )

  } catch (e) {
    m.reply("Terjadi kesalahan saat memproses gambar")
  }
}

handler.command = ["flux"]
handler.tags = ["ai"]
handler.help = ["flux <prompt>"]

export default handler