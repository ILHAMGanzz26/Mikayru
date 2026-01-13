/**
 * plugins/_/kirimpesan.js
 * Safe broadcast -> kirim DM ke semua member grup dengan batching, delay acak, cooldown, retry, dan logging.
 *
 * Konfigurasi: ubah konstanta di bawah sesuai kebutuhan/servermu.
 */

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

let handler = async (m, { conn, text, usedPrefix, command }) => {
  if (!text)
    return m.reply(
      `📢 Format:\n${usedPrefix + command} <id_grup> <pesan>\n\nContoh:\n${usedPrefix + command} 1203630xxxx@g.us Halo semua!`
    )

  // ----- CONFIG (ubah sesuai kebutuhan) -----
  const BATCH_SIZE = 25               // maksimal penerima per batch (ubah ke 30-50 jika perlu)
  const PAUSE_BETWEEN_BATCHES_MS = 30 * 60 * 1000 // jeda antar batch (default 30 menit)
  const MIN_DELAY_MS = 2000           // delay acak minimal antar pesan (2 detik)
  const MAX_DELAY_MS = 5000           // delay acak maksimal antar pesan (5 detik)
  const COOLDOWN_DAYS = 7             // jangan kirim ulang ke nomor yang sudah dikirimi dalam X hari
  const MAX_RETRY = 2                 // retry saat gagal
  const RETRY_BASE_DELAY_MS = 2000    // base delay untuk exponential backoff
  // ------------------------------------------

  const [groupId, ...pesanArr] = text.trim().split(' ')
  const pesanOriginal = pesanArr.join(' ').trim()

  if (!groupId || !groupId.endsWith('@g.us'))
    return m.reply('❌ Format ID grup tidak valid!\nContoh: 1203630xxxxxxxxx@g.us')
  if (!pesanOriginal) return m.reply('⚠️ Pesan tidak boleh kosong!')

  // file untuk menyimpan log (persist)
  const __filename = fileURLToPath(import.meta.url)
  const __dirname = path.dirname(__filename)
  const dataFile = path.join(process.cwd(), 'sent_log_kirimpesan.json')

  // baca atau buat file log
  let sentLog = {}
  try {
    if (fs.existsSync(dataFile)) {
      const raw = fs.readFileSync(dataFile, 'utf8')
      sentLog = raw ? JSON.parse(raw) : {}
    } else {
      fs.writeFileSync(dataFile, JSON.stringify({}), 'utf8')
      sentLog = {}
    }
  } catch (e) {
    console.log('⚠️ Gagal baca/tulis sent log:', e)
    sentLog = {}
  }

  // ambil metadata grup
  let metadata
  try {
    metadata = await conn.groupMetadata(groupId)
  } catch (e) {
    console.log(e)
    return m.reply('❌ Gagal mengambil metadata grup. Pastikan bot ada di grup tersebut dan bot punya izin.')
  }

  const groupName = metadata.subject || 'Tanpa Nama'
  // daftar member (skip bot sendiri)
  let members = metadata.participants
    .map(p => p.id)
    .filter(jid => jid && jid.endsWith('@s.whatsapp.net') && jid !== conn.user.jid)

  if (!members.length) return m.reply('❌ Tidak ada member valid di grup ini.')

  // Filter berdasarkan cooldown
  const now = Date.now()
  const cooldownMs = COOLDOWN_DAYS * 24 * 60 * 60 * 1000
  const toSend = members.filter(jid => {
    const last = sentLog[jid]
    if (!last) return true
    return now - last >= cooldownMs
  })

  if (!toSend.length) return m.reply(`⚠️ Semua member sudah dikirimi dalam ${COOLDOWN_DAYS} hari terakhir. Tidak ada yang perlu dikirimi.`)

  // Konfirmasi ringkas sebelum mulai (owner-only, jadi langsung jalan)
  m.reply(`🚀 Mulai mengirim ke *${toSend.length}* member (dari grup *${groupName}*).\nBatch size: ${BATCH_SIZE}. Jeda antar pesan acak ${MIN_DELAY_MS}-${MAX_DELAY_MS} ms. Cooldown: ${COOLDOWN_DAYS} hari.`)

  // helper: delay
  const wait = ms => new Promise(res => setTimeout(res, ms))

  let sukses = 0, gagal = 0, skipped = members.length - toSend.length
  // proses per batch
  for (let i = 0; i < toSend.length; i += BATCH_SIZE) {
    const batch = toSend.slice(i, i + BATCH_SIZE)

    for (const jid of batch) {
      // personalisasi simple (coba ambil nama jika ada)
      let displayName = jid.split('@')[0]
      try {
        // conn.getName biasanya tersedia di banyak base Baileys
        const name = await conn.getName(jid).catch(() => null)
        if (name) displayName = name
      } catch (e) {
        // ignore
      }

      const pesan = `Hai ${displayName},\n\n${pesanOriginal}`

      // kirim dengan retry + exponential backoff
      let attempt = 0
      let sent = false
      while (attempt <= MAX_RETRY && !sent) {
        try {
          await conn.sendMessage(jid, { text: pesan })
          sent = true
          sukses++
          // catat waktu kirim
          sentLog[jid] = Date.now()
          // persist cepat (tulis setiap sukses agar tidak hilang)
          try {
            fs.writeFileSync(dataFile, JSON.stringify(sentLog, null, 2), 'utf8')
          } catch (e) {
            console.log('⚠️ Gagal update sent log:', e)
          }
        } catch (err) {
          attempt++
          console.log(`Gagal kirim ke ${jid} (attempt ${attempt}):`, err?.message || err)
          if (attempt > MAX_RETRY) {
            gagal++
            break
          } else {
            // backoff
            const backoff = RETRY_BASE_DELAY_MS * Math.pow(2, attempt)
            await wait(backoff)
          }
        }
      }

      // delay acak antar pesan (min..max)
      const delay = MIN_DELAY_MS + Math.floor(Math.random() * (MAX_DELAY_MS - MIN_DELAY_MS + 1))
      await wait(delay)
    }

    // Jika masih ada batch berikutnya, pause antar-batch
    if (i + BATCH_SIZE < toSend.length) {
      m.reply(`⏸️ Batch selesai (kirim ${Math.min(i + BATCH_SIZE, toSend.length)} / ${toSend.length}). Bot akan jeda selama ${Math.floor(PAUSE_BETWEEN_BATCHES_MS / 60000)} menit sebelum melanjutkan.`)
      await wait(PAUSE_BETWEEN_BATCHES_MS)
    }
  }

  // akhir: laporan
  m.reply(`✅ Selesai!\nTerkirim: ${sukses}\nGagal: ${gagal}\nSkip (karena cooldown): ${skipped}\nTotal target awal: ${members.length}`)

  // final persist (redundan)
  try {
    fs.writeFileSync(dataFile, JSON.stringify(sentLog, null, 2), 'utf8')
  } catch (e) {
    console.log('⚠️ Gagal simpan sent log terakhir:', e)
  }
}

handler.help = ['kirimpesan <id_grup> <pesan>']
handler.tags = ['owner']
handler.command = /^kirimpesan$/i
handler.owner = true

export default handler