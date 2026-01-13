import fs from "fs";
import { spawn } from "child_process";
import path from "path";

let handler = async (m, { conn, args, usedPrefix, command }) => {
    try {
        const towidth = parseInt(args[0]);
        const toheight = parseInt(args[1]);
        if (isNaN(towidth) || isNaN(toheight) || towidth <= 0 || toheight <= 0)
            return m.reply(`🎬 Masukkan ukuran video dengan benar!\nContoh: ${usedPrefix + command} 720 480`);

        const q = m.quoted ? m.quoted : m;
        const mime = q?.mimetype || q?.msg?.mimetype || q?.mediaType || "";
        if (!mime) return m.reply("❌ Tidak ada media terdeteksi. Reply atau kirim video.");
        if (!/video/i.test(mime)) return m.reply(`❌ Format tidak didukung: ${mime}`);

        await global.loading(m, conn);

        const media = await q.download();
        if (!media?.length) return m.reply("⚠️ Gagal mengunduh video.");

        const inputPath = path.join("./tmp", `input_${Date.now()}.mp4`);
        const outputPath = path.join("./tmp", `output_${Date.now()}.mp4`);
        fs.writeFileSync(inputPath, media);

        const start = Date.now();

        // Jalankan ffmpeg untuk resize video
        await new Promise((resolve, reject) => {
            const ffmpeg = spawn("ffmpeg", [
                "-y",
                "-i", inputPath,
                "-vf", `scale=${towidth}:${toheight}`,
                "-c:a", "copy", // salin audio tanpa diubah
                outputPath
            ]);

            ffmpeg.on("error", reject);
            ffmpeg.stderr.on("data", (data) => process.stdout.write(data.toString()));
            ffmpeg.on("close", (code) => {
                if (code === 0) resolve();
                else reject(new Error("ffmpeg error, kode keluar: " + code));
            });
        });

        const end = ((Date.now() - start) / 1000).toFixed(2);

        const caption = [
            "🎞️ *Video Resize*",
            `📐 Resolusi: ${towidth}×${toheight}`,
            `⏱️ Waktu proses: ${end}s`,
            "✅ Resize video selesai!"
        ].join("\n");

        await conn.sendMessage(
            m.chat,
            { video: fs.readFileSync(outputPath), caption },
            { quoted: m }
        );

        fs.unlinkSync(inputPath);
        fs.unlinkSync(outputPath);

    } catch (e) {
        console.error(e);
        m.reply(`❌ Error: ${e.message}`);
    } finally {
        await global.loading(m, conn, true);
    }
};

handler.help = ["resizevid <width> <height>"];
handler.tags = ["tools"];
handler.command = /^(resizevid|resizevideo)$/i;

export default handler;