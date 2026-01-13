import fetch from "node-fetch"

let handler = async (m, { text, usedPrefix, command }) => {
  try {
    // Ambil kode dari text atau reply
    let code = text || (m.quoted && m.quoted.text)
    if (!code) {
      return m.reply(
        `✳️ Contoh penggunaan:\n\n` +
        `${usedPrefix + command} console.log("Hello World")\n\n` +
        `Atau reply pesan berisi kode JS dengan:\n` +
        `${usedPrefix + command}`
      )
    }

    m.reply("⏳ Meng-encrypt / obfuscate code...")

    // Encode ke URL
    let encoded = encodeURIComponent(code)
    let url = `https://zelapioffciall.koyeb.app/tools/obfuscate?code=${encoded}`

    let res = await fetch(url)
    let json = await res.json()

    if (!json.status || !json.result) {
      throw "Gagal obfuscate"
    }

    let result = json.result

    // Jika hasil panjang → kirim sebagai file
    if (result.length > 3500) {
      await m.reply(
        result,
        null,
        {
          mimetype: "text/javascript",
          filename: "encrypted.js"
        }
      )
    } else {
      await m.reply(
        `✅ *Encrypt / Obfuscate Berhasil!*\n\n` +
        "```js\n" +
        result +
        "\n```"
      )
    }

  } catch (err) {
    console.error(err)
    m.reply("❌ Terjadi kesalahan saat encrypt code.")
  }
}

handler.help = ["enc <kode js>", "obfuscate <kode js>"]
handler.tags = ["tools"]
handler.command = /^enc|obfuscate$/i

export default handler