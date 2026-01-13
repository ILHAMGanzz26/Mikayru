import fs from "fs";
import path from "path";

let handler = async (m, { text, usedPrefix, command }) => {
    let baseDir = "plugins";

    // ✅ Jika tidak ada argumen & tidak reply → tampilkan isi folder plugins
    if (!text && !m.quoted) {
        let target = baseDir;
        if (!fs.existsSync(target)) return m.reply(`🍩 *Folder ${target} tidak ada!*`);
        
        let list = fs
            .readdirSync(target)
            .map((name) => {
                let stats = fs.statSync(path.join(target, name));
                return {
                    name,
                    isDir: stats.isDirectory(),
                };
            })
            .sort((a, b) => {
                if (a.isDir && !b.isDir) return -1;
                if (!a.isDir && b.isDir) return 1;
                return a.name.localeCompare(b.name);
            })
            .map((item) => (item.isDir ? `📁 ${item.name}/` : `📄 ${item.name}`))
            .join("\n");

        return m.reply(`🌸 *Isi Folder: ${target}*\n\n${list}`);
    }

    // ✅ Jika tidak reply file/teks → tampilkan isi folder tujuan
    if (!m.quoted) {
        let target = path.join(baseDir, ...text.split("/"));
        if (!fs.existsSync(target)) return m.reply(`🍩 *Folder ${target} tidak ada!*`);
        
        let list = fs
            .readdirSync(target)
            .map((name) => {
                let stats = fs.statSync(path.join(target, name));
                return {
                    name,
                    isDir: stats.isDirectory(),
                };
            })
            .sort((a, b) => {
                if (a.isDir && !b.isDir) return -1;
                if (!a.isDir && b.isDir) return 1;
                return a.name.localeCompare(b.name);
            })
            .map((item) => (item.isDir ? `📁 ${item.name}/` : `📄 ${item.name}`))
            .join("\n");

        return m.reply(`🌸 *Isi Folder: ${target}*\n\n${list}`);
    }

    // ✅ Kalau reply teks → simpan sebagai file .js
    if (m.quoted.text) {
        if (!text) return m.reply(`❌ Contoh:\n.reply teks → *${usedPrefix + command} folder/namafile.js*`);
        
        let fullpath = path.join(baseDir, text);
        fs.mkdirSync(path.dirname(fullpath), { recursive: true });
        fs.writeFileSync(fullpath, m.quoted.text, "utf-8");
        return m.reply(`✅ Teks berhasil disimpan ke:\n📁 *${fullpath}*`);
    }

    // ✅ Kalau reply media/file → simpan secara otomatis
    let mime = (m.quoted.msg || m.quoted).mimetype || m.quoted.mediaType || "";
    if (!mime) return m.reply(`❌ Pesan yang direply bukan media atau teks!`);

    let buffer = await m.quoted.download().catch(() => null);
    if (!buffer) return m.reply(`❌ Gagal download media!`);

    let args = text ? text.split("/") : [];
    let ext = mime.split("/")[1] || "bin";
    let filename = args[args.length - 1] || `file_${Date.now()}.${ext}`;
    let fullpath = path.join(baseDir, ...args.slice(0, -1), filename);

    fs.mkdirSync(path.dirname(fullpath), { recursive: true });
    fs.writeFileSync(fullpath, buffer);

    await m.reply(`🍓 *\`Success\`*\n📁 *${fullpath}*`);
};

handler.help = ["sp"];
handler.tags = ["owner"];
handler.command = /^sp$/i;
handler.mods = true;

export default handler;