// Regex untuk link invite WA, Telegram, Discord
const inviteLinkRegex = /(https?:\/\/chat\.whatsapp\.com\/[A-Za-z0-9]+|https?:\/\/t\.me\/[A-Za-z0-9_]+|https?:\/\/telegram\.me\/[A-Za-z0-9_]+|https?:\/\/discord\.gg\/[A-Za-z0-9]+)/gi;

let deleteQueue = Promise.resolve();

export async function before(m, { isAdmin, isBotAdmin, isMods }) {
    const isOwner = global.config.owner.some(([number]) => m.sender.includes(number));
    if (m.isBaileys || m.fromMe || isOwner || isAdmin || isMods) return true;

    let chat = global.db.data.chats[m.chat];
    if (!chat) return true;
    if (!chat.antiLinks || !m.isGroup) return;
    if (!isBotAdmin) return true;

    const msgContent =
        m.text ||
        m.message?.extendedTextMessage?.text ||
        m.message?.imageMessage?.caption ||
        m.message?.videoMessage?.caption ||
        "";

    // Cek apakah ada link invite
    const links = msgContent.match(inviteLinkRegex);
    if (!links || links.length === 0) return true;

    deleteQueue = deleteQueue.then(async () => {
        try {
            // Hapus pesan
            await this.sendMessage(m.chat, {
                delete: {
                    remoteJid: m.chat,
                    fromMe: false,
                    id: m.key.id,
                    participant: m.key.participant || m.sender,
                },
            });

            // Inisialisasi peringatan user jika belum ada
            if (!chat.warnings) chat.warnings = {};
            if (!chat.warnings[m.sender]) chat.warnings[m.sender] = 0;

            // Tambah 1 peringatan
            chat.warnings[m.sender] += 1;

            const warnCount = chat.warnings[m.sender];

            if (warnCount < 3) {
                await this.sendMessage(m.chat, {
                    text: `⚠️ @${m.sender.split('@')[0]}, kamu telah mengirim link invite sosial media. Peringatan ${warnCount}/3.`,
                    mentions: [m.sender]
                });
            } else {
                // Kick user setelah peringatan ke-3
                await this.sendMessage(m.chat, {
                    text: `❌ @${m.sender.split('@')[0]} telah melakukan pelanggaran 3 kali. Kamu akan dikeluarkan dari grup.`,
                    mentions: [m.sender]
                });

                // Kick user (bot harus admin)
                try {
                    await this.groupParticipantsUpdate(m.chat, [m.sender], "remove");
                } catch (e) {
                    console.error("Gagal kick user:", e);
                }

                // Reset peringatan setelah kick
                chat.warnings[m.sender] = 0;
            }

            await new Promise((resolve) => setTimeout(resolve, 300));
        } catch (e) {
            console.error(e);
        }
    });

    return true;
}