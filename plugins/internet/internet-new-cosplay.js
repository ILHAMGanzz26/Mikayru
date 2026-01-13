let handler = async (m, { conn, text, usedPrefix, command }) => {
  try {
    if (!text) return conn.reply?.(m.chat, `Contoh penggunaan:\n${usedPrefix + command} Nahida`, m);

    // ====== Konfigurasi ======
    const MAX_IMAGES = 20;        // batasi jumlah gambar yang dikirim
    const USE_RANDOM_DELAY = true; // true = delay acak, false = delay tetap
    const MIN_DELAY = 2000;       // ms (untuk random delay)
    const MAX_DELAY = 3500;       // ms (untuk random delay)
    const FIXED_DELAY = 2000;     // ms (kalau random dimatikan)
    // ==========================

    const axios = (await import('axios')).default;
    const apiUrl = `https://api.nekolabs.my.id/discovery/cosplaytele/search?q=${encodeURIComponent(text)}`;
    const { data } = await axios.get(apiUrl, { timeout: 15000 });

    // Ambil link gambar dari JSON
    let urls = [];
    const pushIfUrl = (v) => {
      if (!v || typeof v !== 'string') return;
      if (/^https?:\/\/.+\.(jpg|jpeg|png|gif|webp)(\?.*)?$/i.test(v)) urls.push(v);
    };

    const walk = (obj) => {
      if (!obj) return;
      if (typeof obj === 'string') return pushIfUrl(obj);
      if (Array.isArray(obj)) return obj.forEach(walk);
      if (typeof obj === 'object') {
        for (const k of Object.keys(obj)) {
          const val = obj[k];
          if (typeof val === 'string') pushIfUrl(val);
          else walk(val);
        }
      }
    };

    if (data?.result) walk(data.result);
    if (data?.data) walk(data.data);
    if (data?.results) walk(data.results);
    walk(data);

    // Fallback cari URL dari stringify
    if (urls.length === 0) {
      const s = JSON.stringify(data);
      const found = [...s.matchAll(/https?:\/\/[^"']+\.(?:jpg|jpeg|png|gif|webp)(\?[^"']*)?/ig)].map(m => m[0]);
      urls.push(...found);
    }

    // unik + limit
    urls = Array.from(new Set(urls)).slice(0, MAX_IMAGES);

    if (!urls.length) {
      return conn.reply?.(m.chat, `Tidak ditemukan gambar untuk: ${text}`, m);
    }

    await conn.reply?.(
      m.chat,
      `Menemukan ${urls.length} gambar. Mengirim satu-per-satu...`,
      m
    );

    const sleep = (ms) => new Promise(r => setTimeout(r, ms));
    const randDelay = () => Math.floor(Math.random() * (MAX_DELAY - MIN_DELAY + 1)) + MIN_DELAY;
    const getDelay = () => (USE_RANDOM_DELAY ? randDelay() : FIXED_DELAY);

    for (let i = 0; i < urls.length; i++) {
      const imageUrl = urls[i];
      const caption = `Mengirim Cosplay ${text} (${i + 1}/${urls.length})`;

      try {
        // ✅ WAJIB: Kirim sebagai GAMBAR langsung (bukan stiker)
        await conn.sendMessage(
          m.chat,
          { image: { url: imageUrl }, caption },
          { quoted: m }
        );
      } catch (err) {
        console.error('Gagal mengirim gambar:', imageUrl, err?.message || err);
        try {
          await conn.reply?.(m.chat, `Gagal mengirim gambar ${i + 1}, lanjut...`, m);
        } catch {}
      }

      if (i < urls.length - 1) {
        await sleep(getDelay());
      }
    }

    await conn.reply?.(m.chat, `Selesai mengirim ${urls.length} gambar.`, m);

  } catch (e) {
    console.error(e);
    return conn.reply?.(m.chat, `Terjadi error: ${e?.message || e}`, m);
  }
}

handler.help = ['cosplay <query>']
handler.tags = ['internet', 'anime', 'owner']
handler.command = /^(cosplay|cosplaytele)$/i
handler.owner = true

export default handler