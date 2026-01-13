let ceramahQueue = Promise.resolve();
const CERAMAH_COOLDOWN = 30 * 1000;
const lastCeramah = new Map();

const badWords = [
  "anjing","bangsat","kontol","memek","ngentot",
  "babi","goblok","tolol","tai","taik",
  "kampret","brengsek","bacot","peler",
  "kimak","pepek","jancok","asu",
  "lonte","pelacur",
  "fuck","fucking","motherfucker","shit",
  "asshole","bitch","bastard","dick",
  "pussy","cock","slut","whore","retard"
];

function normalizeText(text) {
  return text
    .toLowerCase()
    .replace(/[4@]/g, "a")
    .replace(/[1!|]/g, "i")
    .replace(/[3]/g, "e")
    .replace(/[0]/g, "o")
    .replace(/[5\$]/g, "s")
    .replace(/[7]/g, "t")
    .replace(/[^a-z]/g, "");
}

function containsBadword(text) {
  const clean = normalizeText(text);
  return badWords.some(word => {
    const pattern = new RegExp(word.split("").join("+"), "i");
    return pattern.test(clean);
  });
}

export async function before(m, { conn, isAdmin, isBotAdmin, isMods }) {
  const isOwner = global.config.owner.some(([num]) =>
    m.sender.includes(num)
  );

  if (m.isBaileys || m.fromMe || isOwner || isAdmin || isMods) return true;

  const chat = global.db.data.chats[m.chat];
  if (!chat || !m.isGroup) return true;
  if (!isBotAdmin) return true;

  const text =
    m.text ||
    m.message?.extendedTextMessage?.text ||
    m.message?.imageMessage?.caption ||
    m.message?.videoMessage?.caption ||
    "";

  if (!text) return true;
  if (!containsBadword(text)) return true;

  ceramahQueue = ceramahQueue.then(async () => {
    try {
      // Hapus pesan kasar
      await conn.sendMessage(m.chat, {
        delete: {
          remoteJid: m.chat,
          fromMe: false,
          id: m.key.id,
          participant: m.key.participant || m.sender,
        },
      });

      const now = Date.now();
      const last = lastCeramah.get(m.sender) || 0;

      if (now - last < CERAMAH_COOLDOWN) return;

      lastCeramah.set(m.sender, now);

      // Ceramah di grup
      await conn.sendMessage(m.chat, {
        text:
`🛑 *Etika Grup*

@${m.sender.split("@")[0]}, mohon jaga ucapan.
Gunakan bahasa yang sopan dan saling menghormati 🙏`,
        mentions: [m.sender],
      });

      // Ceramah via DM (lebih personal)
      await conn.sendMessage(m.sender, {
        text:
`Halo 👋  
Pesan kamu barusan mengandung kata yang tidak pantas, jadi dihapus otomatis.

💡 Tips:
• Jaga kata-kata
• Hormati anggota lain
• Diskusi sehat bikin grup nyaman

Terima kasih sudah memahami 🙏`
      });

      await new Promise(r => setTimeout(r, 300));
    } catch (e) {
      console.error("[ANTI BADWORD CERAMAH+]", e);
    }
  });

  return true;
}