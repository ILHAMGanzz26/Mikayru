import axios from 'axios';

let handler = async (m, { conn, text, usedPrefix, command }) => {
    if (!text) return m.reply(`Masukkan domain atau URL!\nContoh: ${usedPrefix}${command} ilhm.my.id`);

    // Pastikan URL pakai https://
    let urlInput = text.startsWith('http://') || text.startsWith('https://') ? text : `https://${text}`;
    let encodedUrl = encodeURIComponent(urlInput);
    let imageBuffer;

    // Coba API pertama
    try {
        const res1 = await axios.get(`https://api.zenzxz.my.id/api/tools/ssweb?url=${encodedUrl}`, {
            responseType: 'arraybuffer' // hasil berupa gambar
        });
        imageBuffer = Buffer.from(res1.data, 'binary');
    } catch (e1) {
        // Jika API pertama gagal, pakai API kedua
        try {
            const res2 = await axios.get(`https://anabot.my.id/api/tools/ssweb?url=${encodedUrl}&device=windows&fullPage=on&apikey=freeApikey`);
            if (res2.data && res2.data.success && res2.data.data?.result) {
                const imgRes = await axios.get(res2.data.data.result, { responseType: 'arraybuffer' });
                imageBuffer = Buffer.from(imgRes.data, 'binary');
            } else {
                throw new Error('API kedua gagal');
            }
        } catch (e2) {
            return m.reply('Maaf, kedua API SS Web gagal. Coba lagi nanti.');
        }
    }

    // Kirim gambar ke WA
    await conn.sendMessage(m.chat, { image: imageBuffer }, { quoted: m });
};

handler.help = ['ssweb <domain/url>'];
handler.tags = ['tools'];
handler.command = /^ssweb$/i;

export default handler;