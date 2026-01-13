import fs from "fs";
import path from "path";
import os from "os";

let handler = async (m, { conn, usedPrefix, command }) => {
    let tempFile;
    try {
        if (!m.quoted || !/audio/.test(m.quoted.mimetype || "")) {
            return m.reply(`*Contoh: reply audio lalu ketik ${usedPrefix + command}*`);
        }

        await conn.sendMessage(m.chat, { react: { text: "⏳", key: m.key } });

        const buffer = await m.quoted.download();
        if (!buffer) throw new Error("Gagal mengunduh audio");

        const tmpDir = os.tmpdir();
        tempFile = path.join(tmpDir, `${Date.now()}.mp3`);
        fs.writeFileSync(tempFile, buffer);

        const form = new FormData();
        form.append("fileName", new Blob([fs.readFileSync(tempFile)]), "audio.mp3");

        const upload = await fetch("https://aivocalremover.com/api/v2/FileUpload", {
            method: "POST",
            headers: {
                "User-Agent": "Mozilla/5.0 (Linux; Android 10)"
            },
            body: form
        }).then(r => r.json());

        if (!upload?.file_name) throw new Error("Upload audio gagal");

        const body = new URLSearchParams({
            file_name: upload.file_name,
            action: "watermark_video",
            key: "X9QXlU9PaCqGWpnP1Q4IzgXoKinMsKvMuMn3RYXnKHFqju8VfScRmLnIGQsJBnbZFdcKyzeCDOcnJ3StBmtT9nDEXJn",
            web: "web"
        });

        const process = await fetch("https://aivocalremover.com/api/v2/ProcessFile", {
            method: "POST",
            headers: {
                "User-Agent": "Mozilla/5.0 (Linux; Android 10)",
                "Content-Type": "application/x-www-form-urlencoded",
                origin: "https://aivocalremover.com",
                referer: "https://aivocalremover.com/"
            },
            body
        }).then(r => r.json());

        if (!process?.instrumental_path || !process?.vocal_path) {
            throw new Error("Proses pemisahan audio gagal");
        }

        await conn.sendMessage(
            m.chat,
            {
                audio: { url: process.instrumental_path },
                mimetype: "audio/mpeg",
                ptt: false
            },
            { quoted: m }
        );

        await conn.sendMessage(
            m.chat,
            {
                audio: { url: process.vocal_path },
                mimetype: "audio/mpeg",
                ptt: false
            },
            { quoted: m }
        );

        await m.reply(`*Berhasil memisahkan audio!* 🎶✨\n\n*• Instrumental*\n*• Vocal*`);

    } catch (e) {
        await m.reply(`*Gagal memproses audio* 🍂\n\n${e.message}`);
    } finally {
        if (tempFile && fs.existsSync(tempFile)) fs.unlinkSync(tempFile);
        await conn.sendMessage(m.chat, { react: { text: "", key: m.key } });
    }
};

handler.help = ["vocalremover"];
handler.tags = ["tools"];
handler.command = /^(vocalremover|aivocal)$/i;

export default handler;