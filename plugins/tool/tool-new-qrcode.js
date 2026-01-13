import FormData from "form-data"

let handler = async (m, { conn, text, usedPrefix, command }) => {
    try {
        if (!text) return m.reply(`*Contoh: ${usedPrefix + command} teks|#000000|#ffffff*`)

        await conn.sendMessage(m.chat, { react: { text: '⏳', key: m.key } })

        let quoted = m.quoted ? m.quoted : m
        let mime = quoted.mimetype || ''
        let isImage = /image/.test(mime)

        let [data, bodyColor, bgColor] = text.split('|').map(v => v.trim())
        if (!data) throw 'Teks tidak boleh kosong 🍂'

        bodyColor = bodyColor || '#000000'
        bgColor = bgColor || '#FFFFFF'

        let logoFile = null

        if (isImage) {
            let buffer = await quoted.download()
            let up = new FormData()
            up.append('file', buffer, 'logo.png')

            let upload = await fetch('https://api.qrcode-monkey.com/qr/uploadimage', {
                method: 'POST',
                headers: {
                    ...up.getHeaders(),
                    'User-Agent': 'Mozilla/5.0',
                    'origin': 'https://www.qrcode-monkey.com',
                    'referer': 'https://www.qrcode-monkey.com/'
                },
                body: up
            })

            let upJson = await upload.json()
            if (!upJson?.file) throw 'Upload logo gagal 🍂'

            logoFile = upJson.file
        }

        let payload = {
            data,
            config: {
                body: 'square',
                eye: 'frame0',
                eyeBall: 'ball0',
                bodyColor,
                bgColor,
                eye1Color: bodyColor,
                eye2Color: bodyColor,
                eye3Color: bodyColor,
                eyeBall1Color: bodyColor,
                eyeBall2Color: bodyColor,
                eyeBall3Color: bodyColor,
                gradientColor1: '',
                gradientColor2: '',
                gradientType: 'linear',
                gradientOnEyes: true,
                ...(logoFile ? { logo: logoFile, logoMode: 'default' } : {})
            },
            size: 1000,
            download: 'imageUrl',
            file: 'png'
        }

        let res = await fetch('https://api.qrcode-monkey.com/qr/custom', {
            method: 'POST',
            headers: {
                'User-Agent': 'Mozilla/5.0',
                'Content-Type': 'text/plain;charset=UTF-8',
                'origin': 'https://www.qrcode-monkey.com',
                'referer': 'https://www.qrcode-monkey.com/'
            },
            body: JSON.stringify(payload)
        })

        if (!res.ok) throw 'Generate QR gagal 🍂'

        let json = await res.json()
        if (!json?.imageUrl) throw 'QR tidak ditemukan 🍂'

        let image = 'https:' + json.imageUrl

        await conn.sendMessage(m.chat, {
            image: { url: image },
            caption: `*📸 QRCode Berhasil Dibuat*\n\n*📝 Teks:* ${data}\n*🎨 Warna QR:* ${bodyColor}\n*🧻 Background:* ${bgColor}\n*🖼️ Logo:* ${logoFile ? 'Aktif' : 'Tidak'}`
        }, { quoted: m })

    } catch (e) {
        await m.reply(`*🍂 ERROR TERJADI*\n${e}`)
    } finally {
        await conn.sendMessage(m.chat, { react: { text: '', key: m.key } })
    }
}

handler.help = ['qrcode'];
handler.tags = ['tools'];
handler.command = /^(qrcode)$/i;

export default handler