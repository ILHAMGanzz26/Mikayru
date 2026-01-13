import fetch from "node-fetch"

const API = "https://api.ilhm.my.id/ai/muslim"

let handler = async (m, { conn, text }) => {
  if (!text) return m.reply(
`Masukkan pertanyaan islami
Contoh: .muslim apa itu islam`
  )

  await global.loading(m, conn)

  try {
    const url = `${API}?text=${encodeURIComponent(text)}`
    const res = await fetch(url)
    const json = await res.json()

    if (!json.status) throw "Gagal mendapatkan jawaban"

    const result = json.result
      .replace(/\n\n+/g, "\n")
      .trim()

    await conn.sendMessage(
      m.chat,
      {
        text:
`📖 *AI MUSLIM*
━━━━━━━━━━━━━━

📝 *Pertanyaan*
${text}

📚 *Jawaban*
${result}

━━━━━━━━━━━━━━
👤 Creator : ${json.creator}
🌐 Source  : api.ilhm.my.id`
      },
      { quoted: m }
    )

  } catch (e) {
    m.reply("❌ Terjadi kesalahan saat memproses pertanyaan")
  }
}

handler.command = ["islam", "muslim"]
handler.tags = ["ai"]
handler.help = ["islam <pertanyaan>"]

export default handler