let handler = async (m, { conn, usedPrefix, command }) => {
  try {
    // Trigger command teks atau tombol Next Foto
    if (!(m.text === ".zee" || m.selectedButtonId === "")) return;

    const urlJSON = "https://raw.githubusercontent.com/ILHAMGanzz26/dbbot/refs/heads/main/JKT48/ZEE/zee.json";
    const res = await fetch(urlJSON);
    const images = await res.json();

    if (!Array.isArray(images) || images.length === 0)
      return m.reply("❌ Data kosong");

    const random = images[Math.floor(Math.random() * images.length)];
    if (typeof random !== "string") return m.reply("❌ Data gambar tidak valid");

    // Quick reply buttons supaya bisa dipencet
    const buttons = [
      {
        name: "quick_reply",
        buttonParamsJson: JSON.stringify({
          display_text: "Next Foto",
          id: ".zee"
        })
      },
    ];

    await conn.sendMessage(m.chat, {
      image: { url: random },
      caption: "💖 Random Zee JKT48",
      footer: "Klik tombol untuk foto berikutnya",
      interactiveButtons: buttons,
      hasMediaAttachment: true
    }, { quoted: m });

  } catch (err) {
    console.log(err);
    m.reply("❌ Terjadi kesalahan: " + err.message);
  }
};

handler.help = ["zee"];
handler.tags = ["jkt"];
handler.command = /^\.?zee$/i;

export default handler;