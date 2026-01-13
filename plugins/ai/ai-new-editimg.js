import { Buffer } from "buffer";

let handler = async (m, { conn, text, usedPrefix, command }) => {
    try {
        if (!text) {
            return m.reply(`*Contoh:* ${usedPrefix + command} ubah warna rambut jadi merah`);
        }

        let q = m.quoted ? m.quoted : m;
        let mime = (q.msg || q).mimetype || "";

        if (!mime.startsWith("image/")) {
            return m.reply(`🍂 *Reply gambar yang ingin diedit.*`);
        }

        await conn.sendMessage(m.chat, { react: { text: "⏳", key: m.key } });

        let buffer = await q.download();
        if (!buffer) {
            return m.reply(`🍂 *Gagal membaca gambar.*`);
        }

        let imageBase64 = Buffer.from(buffer).toString("base64");

        let payload = {
            image: imageBase64,
            prompt: text.trim()
        };

        let res = await fetch("https://ai-studio.anisaofc.my.id/api/edit-image", {
            method: "POST",
            headers: {
                "User-Agent": "Mozilla/5.0",
                "Accept": "*/*",
                "Content-Type": "application/json",
                "Origin": "https://ai-studio.anisaofc.my.id",
                "Referer": "https://ai-studio.anisaofc.my.id/"
            },
            body: JSON.stringify(payload)
        });

        let result;
        try {
            result = await res.json();
        } catch {
            return m.reply(`🍂 *Respon server tidak valid.*`);
        }

        if (!result || !result.imageUrl) {
            return m.reply(
                `🍂 *Gagal mengedit gambar.*\n` +
                `Server tidak mengembalikan hasil edit.`
            );
        }

        await conn.sendMessage(
            m.chat,
            {
                image: { url: result.imageUrl }
            },
            { quoted: m }
        );
    } catch {
        m.reply(`🍂 *Terjadi kesalahan saat memproses gambar.*`);
    } finally {
        await conn.sendMessage(m.chat, { react: { text: "", key: m.key } });
    }
};

handler.help = ["edit", "editimg"];
handler.tags = ["ai"];
handler.command = /^(edit|editimg)$/i;

export default handler;