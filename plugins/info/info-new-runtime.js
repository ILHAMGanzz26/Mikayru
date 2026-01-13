import fs from 'fs'
import os from 'os'
import path from 'path'
import { createCanvas } from 'canvas'

let handler = async (m, { conn, text, usedPrefix, command }) => {
    let { d, h, m: mn, s } = runtime(process.uptime())
    let uptimeText = `${d ? `${d} hari ` : ''}${h ? `${h} jam ` : ''}${mn ? `${mn} menit ` : ''}${s ? `${s} detik` : ''}`
    let uptimeImage = await createUptimeImage(uptimeText)

    let { hours, strTime } = getWIBTime()
    let greeting = getGreeting(hours)

    await conn.sendMessage(
        m.chat,
        {
            image: { url: uptimeImage },
            caption: `${greeting}\n\n⏰ *Waktu WIB Sekarang:* ${strTime}\n📡 *Status Bot:* Aktif\n\n🧠 *Runtime:* ${uptimeText}`,
            contextInfo: {
                externalAdReply: {
                    mediaType: 1,
                    title: `OS Runtime: ${formatMs(os.uptime() * 1000)}`,
                    thumbnailUrl: 'https://telegra.ph/file/f6a2b673450a22a2622ec.jpg',
                    renderLargerThumbnail: true,
                    sourceUrl: ''
                }
            }
        },
        {
            quoted: {
                key: {
                    fromMe: false,
                    participant: '0@s.whatsapp.net',
                    remoteJid: 'status@broadcast'
                },
                message: { conversation: '[ I N F O  R U N T I M E  B O T ]' }
            }
        }
    )
}

handler.help = ['runtime', 'uptime']
handler.tags = ['info']
handler.command = /^(runtime|uptime)$/i

export default handler

// ------------------- Fungsi bantu -------------------

// Hitung runtime bot
function runtime(seconds) {
    seconds = Number(seconds)
    const d = Math.floor(seconds / (3600 * 24))
    const h = Math.floor((seconds % (3600 * 24)) / 3600)
    const m = Math.floor((seconds % 3600) / 60)
    const s = Math.floor(seconds % 60)
    return { d, h, m, s }
}

// Ambil waktu WIB
function getWIBTime() {
    const offset = 7 // UTC+7
    const date = new Date()
    const utc = date.getTime() + date.getTimezoneOffset() * 60000
    const wibDate = new Date(utc + 3600000 * offset)
    const hours = wibDate.getHours()
    const minutes = wibDate.getMinutes().toString().padStart(2, '0')
    const seconds = wibDate.getSeconds().toString().padStart(2, '0')
    const strTime = `${hours.toString().padStart(2, '0')}:${minutes}:${seconds}`
    return { hours, strTime }
}

// Greeting otomatis
function getGreeting(hours) {
    if (hours >= 4 && hours < 12) return '🌅 Selamat Pagi!'
    if (hours >= 12 && hours < 15) return '🌞 Selamat Siang!'
    if (hours >= 15 && hours < 18) return '🌇 Selamat Sore!'
    return '🌙 Selamat Malam!'
}

// Buat gambar uptime
async function createUptimeImage(uptimeText) {
    const canvas = createCanvas(600, 200)
    const ctx = canvas.getContext('2d')

    // Background gradient
    const gradient = ctx.createLinearGradient(0, 0, 600, 200)
    gradient.addColorStop(0, '#111')
    gradient.addColorStop(1, '#2c2c2c')
    ctx.fillStyle = gradient
    ctx.fillRect(0, 0, canvas.width, canvas.height)

    // Judul (MIKAYRU RUNTIME)
    ctx.fillStyle = '#00ffff'
    ctx.font = 'bold 28px Arial'
    ctx.textAlign = 'center'
    ctx.fillText('MIKAYRU RUNTIME', canvas.width / 2, 50)

    // Runtime text (lebih kecil dan rapi)
    ctx.fillStyle = '#ffffff'
    ctx.font = 'bold 38px Arial'
    ctx.fillText(uptimeText, canvas.width / 2, 115)

    // Subtext
    ctx.font = '18px Arial'
    ctx.fillStyle = '#aaa'
    ctx.fillText('🕓 Aktif sejak bot dijalankan', canvas.width / 2, 160)

    // Simpan sementara
    const tmpDir = path.join(process.cwd(), 'tmp')
    const filePath = path.join(tmpDir, 'uptime.png')
    fs.mkdirSync(tmpDir, { recursive: true })
    fs.writeFileSync(filePath, canvas.toBuffer('image/png'))
    return filePath
}

// Format waktu OS uptime
function formatMs(ms) {
    const sec = Math.floor(ms / 1000)
    const d = Math.floor(sec / (3600 * 24))
    const h = Math.floor((sec % (3600 * 24)) / 3600)
    const m = Math.floor((sec % 3600) / 60)
    const s = Math.floor(sec % 60)
    return `${d ? d + 'd ' : ''}${h}h ${m}m ${s}s`
}