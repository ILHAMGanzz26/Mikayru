import axios from 'axios';

let handler = async (m, { conn, text, usedPrefix, command }) => {
    if (!text) {
        return m.reply(
            `Masukkan kata kunci pencarian TikTok!\n` +
            `Contoh: ${usedPrefix}${command} Bangyuri`
        );
    }
    
    await conn.sendMessage(m.chat, { react: { text: "⏳", key: m.key } });

    try {
        const api = `https://api.ilhm.my.id/search/tiktok?q=${encodeURIComponent(text)}`;
        const res = await axios.get(api);
        const data = res.data;

        if (!data.status || !data.result || data.result.length === 0) {
            return m.reply('❌ Video TikTok tidak ditemukan.');
        }

        // Ambil video pertama (bisa diganti random)
        const video = data.result[0];

        const caption = `
🎵 *TikTok Search Result*

📌 *Judul:*
${video.title}

🌍 *Region:* ${video.region}
▶️ *Views:* ${video.play_count.toLocaleString()}
❤️ *Likes:* ${video.digg_count.toLocaleString()}

✨ *No Watermark*
🔗 *Powered by ILHM API*
        `.trim();

        await conn.sendMessage(
            m.chat,
            {
                video: { url: video.play }, // NO WM
                caption
            },
            { quoted: m }
        );

    } catch (err) {
        console.error(err);
        m.reply('❌ Terjadi kesalahan saat mengambil data TikTok.');
    }
};

handler.help = ['ttsearch <query>'];
handler.tags = ['search', 'downloader'];
handler.command = /^(ttsearch|tts)$/i;

export default handler;