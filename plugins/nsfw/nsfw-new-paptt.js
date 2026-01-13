import axios from "axios"

let handler = async (m, { conn, command }) => {
    try {
        // Pilih media random
        let url = paptt[Math.floor(Math.random() * paptt.length)]
        let ext = url.split('.').pop()

        // Ambil data buffer pakai axios (lebih stabil dari https)
        let { data } = await axios.get(url, { responseType: 'arraybuffer' })
        let buffer = Buffer.from(data)

        // Cek apakah video atau gambar
        let isVideo = ext === 'mp4' || ext === 'mov' || ext === 'mkv'

        if (isVideo) {
            await conn.sendMessage(m.chat, {
                video: buffer,
                caption: 'Tch, dasar sangean 😳',
            }, { quoted: m })
        } else {
            await conn.sendMessage(m.chat, {
                image: buffer,
                caption: 'Tch, dasar sangean 😳',
            }, { quoted: m })
        }

    } catch (err) {
        console.error(err)
        m.reply('❌ Gagal mengirim media, coba lagi nanti.')
    }
}

handler.help = ['paptt']
handler.tags = ['premium', 'nsfw']
handler.command = /^paptt$/i
handler.premium = true

export default handler

// ===== Daftar media =====
global.paptt = [
    "https://telegra.ph/file/8d5cceb7d6fd4792dc69b.mp4",
    "https://telegra.ph/file/a5730f376956d82f9689c.jpg",
    "https://telegra.ph/file/8fb304f891b9827fa88a5.jpg",
    "https://telegra.ph/file/0c8d173a9cb44fe54f3d3.mp4",
    "https://telegra.ph/file/b58a5b8177521565c503b.mp4",
    "https://telegra.ph/file/34d9348cd0b420eca47e5.jpg",
    "https://telegra.ph/file/73c0fecd276c19560133e.jpg",
    "https://telegra.ph/file/af029472c3fcf859fd281.jpg",
    "https://telegra.ph/file/0e5be819fa70516f63766.jpg",
    "https://telegra.ph/file/29146a2c1a9836c01f5a3.jpg",
    "https://telegra.ph/file/85883c0024081ffb551b8.jpg",
    "https://telegra.ph/file/d8b79ac5e98796efd9d7d.jpg",
    "https://telegra.ph/file/267744a1a8c897b1636b9.jpg",
    "https://telegra.ph/file/5180df19e29f6b6b47089.jpg",
]