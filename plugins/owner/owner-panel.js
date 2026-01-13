import fetch from 'node-fetch'

const domain = 'https://hamzserver.ilhm.my.id'
const appApiKey = `ptla_Fd95KIaJjibF7LCD6ilGOMFpzivhlQ0soLLZkxXZ0CX`
const webPage = 'https://hamzserver.ilhm.my.id'
const node = 1
const nest = 6
const egg = 15

const panelList = {
  1: { ram: 1024, disk: 1024, cpu: 25 },
  2: { ram: 2048, disk: 2048, cpu: 50 },
  3: { ram: 3072, disk: 3072, cpu: 75 },
  4: { ram: 4096, disk: 4096, cpu: 100 },
  5: { ram: 5120, disk: 5120, cpu: 125 },
  6: { ram: 6144, disk: 6144, cpu: 150 },
  7: { ram: 7168, disk: 7168, cpu: 175 },
  unli: { ram: 0, disk: 0, cpu: 0 }
}

let handler = async (m, { conn, args, isOwner }) => {
  if (!isOwner) return m.reply('❌ Hanya owner yang bisa menggunakan perintah ini.')
  if (!args[0] || !args[1] || !args[1].includes('|'))
    return m.reply(`📌 Contoh:\n.buatpanel 3gb 628xx|Matstoree\n.buatpanel unli 628xx|Matstoree`)

  const paketInput = args[0].toLowerCase().replace('gb', '')
  const config = panelList[paketInput]
  if (!config) return m.reply(`❌ Paket tidak tersedia. Gunakan 1gb–7gb atau *unli*.`)

  const paket = paketInput === 'unli' ? 'unli' : `${paketInput}GB`
  const [nomorRaw, unameRaw] = args[1].split('|').map(s => s.trim())
  const username = unameRaw
  const password = username.toLowerCase() + '25'
  const email = `${username}@gmail.com`

  await m.reply(`⏳ Membuat panel *${paket}* untuk *${username}*...`)

  // Ambil info egg
  const eggInfo = await fetch(`${domain}/api/application/nests/${nest}/eggs/${egg}`, {
    headers: { Authorization: `Bearer ${appApiKey}`, Accept: 'application/json' }
  })
  const eggData = await eggInfo.json()

  // Docker image default dari egg (wajib diisi)
  const dockerImage = eggData?.attributes?.docker_images?.[0] || 'docker.io/bionicc/nodejs-wabot:latest'

  // Startup command default npm start
  const startupCmd = 'npm start'

  // Environment variables wajib ada STARTUP_CMD
  const envVars = { STARTUP_CMD: startupCmd }
  if (Array.isArray(eggData?.attributes?.variables)) {
    eggData.attributes.variables.forEach(v => {
      if (v.env_variable !== 'STARTUP_CMD') {
        envVars[v.env_variable] = v.default_value || ''
      }
    })
  }

  // Buat user jika belum ada
  let userId
  const allUsers = await fetch(`${domain}/api/application/users`, {
    headers: { Authorization: `Bearer ${appApiKey}`, Accept: 'application/json' }
  })
  const usersData = await allUsers.json()
  const existingUser = usersData.data.find(u => u.attributes.email.toLowerCase() === email.toLowerCase())

  if (existingUser) {
    userId = existingUser.attributes.id
  } else {
    const createUser = await fetch(`${domain}/api/application/users`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${appApiKey}`, 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({ email, username, first_name: username, last_name: 'server', password })
    })
    const userRes = await createUser.json()
    if (userRes.errors) return m.reply(`❌ Gagal membuat user:\n${JSON.stringify(userRes.errors[0], null, 2)}`)
    userId = userRes.attributes.id
  }

  // Buat server
  const serverRes = await fetch(`${domain}/api/application/servers`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${appApiKey}`, 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify({
      name: `${username}`,
      user: userId,
      egg,
      docker_image: dockerImage, // default, bisa diubah di panel
      startup: startupCmd,
      environment: envVars,
      limits: { memory: config.ram, swap: 0, disk: config.disk, io: 500, cpu: config.cpu },
      feature_limits: { databases: 1, backups: 1, allocations: 1 },
      deploy: { locations: [node], dedicated_ip: false, port_range: [] },
      start_on_completion: true
    })
  })

  const serverData = await serverRes.json()
  if (serverData.errors) return m.reply(`❌ Gagal membuat server:\n${JSON.stringify(serverData.errors[0], null, 2)}`)

  // Expired 30 hari
  const expired = new Date(Date.now() + 30*24*60*60*1000).toISOString().split('T')[0]

  // Kirim info panel ke WhatsApp user
  await conn.sendMessage(nomorRaw.replace(/\D/g, '') + '@s.whatsapp.net', {
    image: { url: 'https://ilhm.my.id/uploads/1766210399305-upload_1766210399023.jpeg' },
    caption: 
`🛠️ *Panel ${paket.toUpperCase()} Berhasil Dibuat!*\n
👤 *Username:* ${username}
📧 *Email:* ${email}
🔐 *Password:* ${password}
📦 *Paket:* ${paket.toUpperCase()}

💻 *Spesifikasi Server:*
• RAM: ${config.ram === 0 ? 'UNLIMITED' : config.ram + ' MB'}
• DISK: ${config.disk === 0 ? 'UNLIMITED' : config.disk + ' MB'}
• CPU: ${config.cpu === 0 ? 'UNLIMITED' : config.cpu + '%'}
• Aktif s.d: ${expired}

🌐 *Panel Login:* ${webPage}

📌 *PERATURAN PENGGUNA PANEL:*
1. Tidak boleh digunakan untuk phishing, ddos, cracking, mining, spam
2. Pelanggaran = suspend tanpa pemberitahuan
3. Admin berhak menutup panel jika disalahgunakan
4. Gunakan dengan bijak & bertanggung jawab
5. Simpan datanya dengan baik, jangan disebarkan

 *Gabung Grub Mikayru*
 _Admin Sering bagi bagi panel untuk pengguna bot jadi tunggu apa lagi buruan join_
 https://chat.whatsapp.com/EIcZbY9VK16FcnGQEc93VN
`
  })

  m.reply(`✅ *Panel ${paket.toUpperCase()} untuk ${username} berhasil dibuat!*\n📬 Info + thumbnail dikirim ke nomor pembeli.`)
}

handler.command = /^buatpanel$/i
handler.tags = ['store']
handler.help = [
  'buatpanel 1gb nomor|username',
  'buatpanel 2gb nomor|username',
  'buatpanel 3gb nomor|username',
  'buatpanel 4gb nomor|username',
  'buatpanel 5gb nomor|username',
  'buatpanel 6gb nomor|username',
  'buatpanel 7gb nomor|username',
  'buatpanel unli nomor|username'
]
handler.owner = true

export default handler