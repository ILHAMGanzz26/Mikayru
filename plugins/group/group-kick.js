let handler = async (m, { conn, text, usedPrefix, command }) => {
    try {
        // Pastikan ini di grup
        if (!m.isGroup) return m.reply('❌ Fitur ini hanya bisa digunakan di grup!');

        // Cek admin pengirim
        const metadata = await conn.groupMetadata(m.chat);
        const senderAdmin = metadata.participants.find(p => p.id === m.sender)?.admin;
        if (!senderAdmin) return m.reply('❌ Kamu harus admin untuk menggunakan ini!');

        // Cek bot admin
        const botAdmin = metadata.participants.find(p => p.id === conn.user.jid)?.admin;
        if (!botAdmin) return m.reply('❌ Bot harus admin agar bisa kick member!');

        // Ambil target: mention atau reply
        let usersToKick = [];
        if (m.mentionedJid && m.mentionedJid.length > 0) {
            usersToKick = m.mentionedJid;
        } else if (m.quoted) {
            usersToKick = [m.quoted.sender];
        } else if (text) {
            usersToKick = [text.includes('@s.whatsapp.net') ? text : text + '@s.whatsapp.net'];
        } else {
            return m.reply(`❌ Format salah!\nContoh:\n${usedPrefix + command} @user\natau reply pesan user dengan ${usedPrefix + command}`);
        }

        // Cek kalau target admin
        const adminList = metadata.participants.filter(p => p.admin).map(p => p.id);
        usersToKick = usersToKick.filter(u => !adminList.includes(u));

        if (usersToKick.length === 0) return m.reply('❌ Tidak bisa kick admin grup.');

        // Kick user
        await conn.groupParticipantsUpdate(m.chat, usersToKick, 'remove');
        m.reply(`✅ Berhasil kick ${usersToKick.length} member.`);
    } catch (err) {
        console.error(err);
        m.reply('❌ Terjadi kesalahan saat mencoba kick member.');
    }
}

handler.command = /^(kick|k)$/i;
handler.group = true;
handler.admin = true;
handler.botAdmin = true;
export default handler;