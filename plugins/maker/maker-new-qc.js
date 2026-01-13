import fetch from "node-fetch";
import { Sticker, StickerTypes } from "wa-sticker-formatter";

let handler = async (m, { conn, text, usedPrefix, command }) => {
    try {
        if (!["qc", "quote"].includes(command)) return;

        if (!text) return m.reply(`🚨 Ketik teks setelah .${command}\n\n*Contoh:* \`${usedPrefix}qc Halo dunia\`\n*Atau pilih warna:* \`${usedPrefix}qc Halo dunia | biru\``);

        let quoteText = text;
        let color = null;

        // Daftar warna populer
        const colorList = {
            merah: "#FF0000",
            hijau: "#00FF00",
            biru: "#0000FF",
            kuning: "#FFFF00",
            pink: "#FF00FF",
            cyan: "#00FFFF",
            orange: "#FFA500",
            putih: "#FFFFFF",
            hitam: "#000000",
            ungu: "#800080"
        };

        // Cek apakah ada | untuk menentukan warna
        if (text.includes("|")) {
            const parts = text.split("|").map(i => i.trim());
            quoteText = parts[0];
            const colorName = parts[1].toLowerCase();
            color = colorList[colorName] || null;
        }

        // Ambil profile picture user
        let profileUrl;
        try {
            profileUrl = await conn.profilePictureUrl(m.sender, "image");
        } catch {
            profileUrl = "https://files.cloudkuimages.guru/images/fb0d54af6aa7.jpeg";
        }

        const userName = m.pushName || "User";

        // Bangun URL API
        const apiUrl = `https://api.nekolabs.my.id/canvas/quote-chat?text=${encodeURIComponent(quoteText)}&name=${encodeURIComponent(userName)}&profile=${encodeURIComponent(profileUrl)}${color ? `&color=${encodeURIComponent(color)}` : ""}`;

        const response = await fetch(apiUrl);
        if (!response.ok) throw new Error("❌ Gagal mengambil gambar dari API");

        const buffer = Buffer.from(await response.arrayBuffer());

        // Buat sticker dengan wa-sticker-formatter agar packName & authorName muncul
        const stickerBuff = await new Sticker(buffer, {
            pack: global.config.stickpack || "MyPack",
            author: global.config.stickauth || "MyBot",
            type: StickerTypes.FULL,
            quality: 100,
            keepScale: true
        }).toBuffer();

        await conn.sendMessage(m.chat, { sticker: stickerBuff }, { quoted: m });

    } catch (err) {
        console.error(err);
        m.reply("❌ Terjadi kesalahan saat membuat quote sticker.");
    }
};

handler.help = ["qc", "quote"];
handler.tags = ["maker", "sticker"];
handler.command = /^qc|quote$/i;

export default handler;