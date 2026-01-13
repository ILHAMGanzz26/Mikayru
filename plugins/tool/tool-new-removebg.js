import fs from "fs";
import fetch from "node-fetch";
import FormData from "form-data";
import path from "path";

const BASE = "https://ilhm.my.id"; // domain uploader

let handler = async (m, { conn }) => {
  try {
    // Ambil media: prioritas quoted → current
    let q = m.quoted ? m.quoted : m;
    let mime = (q.msg || q).mimetype || q.mediaType || "";

    if (!mime) return conn.sendMessage(m.chat, { text: "📌 Kirim atau reply gambar untuk removebg" }, { quoted: m });

    let prosesMsg = await conn.sendMessage(m.chat, { text: "⏳ Memproses, menghapus background..." }, { quoted: m });

    // Download media
    let media = await q.download?.();
    if (!media) {
      try {
        media = await conn.downloadMediaMessage(q);
      } catch {
        throw new Error("Gagal download media (reply tidak terdeteksi).");
      }
    }

    if (!media || !Buffer.isBuffer(media)) throw new Error("Gagal mengambil data media.");

    // Upload ke ilhm.my.id
    let ext = mime.split("/")[1] || "bin";
    let filePath = path.join(".", `upload_${Date.now()}.${ext}`);
    fs.writeFileSync(filePath, media);

    let form = new FormData();
    form.append("file", fs.createReadStream(filePath));

    let uploadRes = await fetch(`${BASE}/api/upload/`, {
      method: "POST",
      body: form,
      headers: form.getHeaders(),
    });

    let text = await uploadRes.text().catch(() => "");
    let data = {};
    try { data = text ? JSON.parse(text) : {}; } catch { data = { raw: text }; }

    try { fs.unlinkSync(filePath); } catch {}

    let url = data.url && typeof data.url === "string"
      ? (data.url.startsWith("http") ? data.url : BASE + data.url)
      : data.storedName ? `${BASE}/uploads/${data.storedName}`
      : data.originalName ? `${BASE}/uploads/${data.originalName}`
      : data.filename ? `${BASE}/uploads/Image/${data.filename}`
      : null;

    if (!url) {
      return conn.sendMessage(m.chat, { text: `❌ Gagal upload media.\nStatus: ${uploadRes.status}\nResponse:\n${JSON.stringify(data, null, 2)}` }, { quoted: prosesMsg });
    }

    // Array endpoint removebg
    const encoded = encodeURIComponent(url);
    const endpoints = [
      `https://api.nekolabs.web.id/tools/remove-bg/v1?imageUrl=${encoded}`,
      `https://api.nekolabs.web.id/tools/remove-bg/v2?imageUrl=${encoded}`,
      `https://api.nekolabs.web.id/tools/remove-bg/v3?imageUrl=${encoded}`,
      `https://api.nekolabs.web.id/tools/remove-bg/v4?imageUrl=${encoded}`,
      `https://api.ootaizumi.web.id/tools/removebg?imageUrl=${encoded}`,
      `https://api.elrayyxml.web.id/api/tools/removebg?url=${encoded}`,
    ];

    let result = null;

    // Fallback semua API
    for (const endpoint of endpoints) {
      const res = await fetch(endpoint).catch(() => null);
      if (!res) continue;

      const contentType = res.headers.get("content-type") || "";

      if (/application\/json/.test(contentType)) {
        const json = await res.json().catch(() => null);
        const data = json?.result || json?.data?.result || json?.output || null;
        const success = json?.success === true || json?.status === true;

        if (success && data) {
          result = { type: "url", data };
          break;
        }
      } else if (/image\/(png|jpe?g|webp)/.test(contentType)) {
        try {
          const reader = res.body.getReader();
          const chunks = [];
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            chunks.push(value);
          }
          reader.releaseLock();
          const totalLength = chunks.reduce((acc, chunk) => acc + chunk.length, 0);
          const combined = new Uint8Array(totalLength);
          let offset = 0;
          for (const chunk of chunks) {
            combined.set(chunk, offset);
            offset += chunk.length;
          }
          result = { type: "buffer", data: Buffer.from(combined.buffer) };
          break;
        } catch {}
      }
    }

    if (!result) {
      return conn.sendMessage(m.chat, { text: "❌ Gagal menghapus background, semua API gagal." }, { quoted: prosesMsg });
    }

    // Kirim hasil ke WA
    if (result.type === "buffer") {
      await conn.sendMessage(m.chat, { image: result.data, caption: "✅ Background berhasil dihapus!" }, { quoted: m });
    } else if (result.type === "url") {
      await conn.sendMessage(m.chat, { image: { url: result.data }, caption: "✅ Background berhasil dihapus!" }, { quoted: m });
    }

  } catch (err) {
    console.error(err);
    await conn.sendMessage(m.chat, { text: `❌ Terjadi kesalahan:\n${err.message}` }, { quoted: m });
  }
};

handler.help = ["removebg"];
handler.tags = ["tools"];
handler.command = /^removebg$/i;

export default handler;