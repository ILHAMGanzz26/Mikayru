import { fileTypeFromBuffer } from "file-type";

let handler = async (m, { conn }) => {
  try {
    await global.loading(m, conn);

    // Ambil media (reply atau kirim langsung)
    let q = m.quoted ? m.quoted : m;
    let media = await q.download().catch(() => null);
    if (!media || !(media instanceof Buffer))
      return m.reply("🍩 *Gagal mengunduh media atau format tidak dikenali.*");

    // Deteksi jenis file
    const type = await fileTypeFromBuffer(media);
    if (!type) return m.reply("📸 *Format file tidak dikenali, kirim gambar yang valid.*");

    // Upload ke qu.ax
    const blob = new Blob([media], { type: type.mime });
    const form = new FormData();
    form.append("files[]", blob, `upload.${type.ext}`);

    const uploadRes = await fetch("https://qu.ax/upload.php", {
      method: "POST",
      body: form,
    });

    const uploadJson = await uploadRes.json().catch(() => null);
    if (!uploadJson?.files?.[0]?.url)
      throw new Error("🍬 *Gagal mengunggah gambar ke qu.ax.*");

    const uploadedUrl = uploadJson.files[0].url.trim();
    console.log("📤 Uploaded:", uploadedUrl);

    // Panggil API Nekolabs
    const apiUrl = `https://api.nekolabs.web.id/tools/convert/toanime?imageUrl=${encodeURIComponent(uploadedUrl)}`;
    console.log("🔗 API URL:", apiUrl);

    const res = await fetch(apiUrl);
    if (!res.ok) throw new Error("🍪 *Gagal menghubungi API.*");

    const json = await res.json();
    if (!json.success || !json.result)
      throw new Error("🍰 *Gagal memproses gambar ke anime.*");

    // Kirim hasil ke user
    await conn.sendMessage(
      m.chat,
      {
        image: { url: json.result },
        caption: "🍫 *Berhasil mengubah gambar menjadi versi Anime!*",
      },
      { quoted: m }
    );
  } catch (e) {
    console.error(e);
    m.reply(`🍮 *Terjadi kesalahan!*\n🍭 *Detail:* ${e.message || e}`);
  } finally {
    await global.loading(m, conn, true);
  }
};

handler.help = ["toanime"];
handler.tags = ["maker"];
handler.command = /^(toanime|animefy)$/i;

export default handler;