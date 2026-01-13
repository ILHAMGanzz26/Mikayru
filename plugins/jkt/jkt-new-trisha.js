let handler = async (m, { conn, usedPrefix, command }) => {
  try {
    // Trigger command teks atau tombol Next Foto
    if (!(m.text === ".trisha" || m.selectedButtonId === "")) return;

    const urlJSON = "https://raw.githubusercontent.com/ILHAMGanzz26/dbbot/refs/heads/main/JKT48/TRISHA/trisha.json";
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
          id: ".trisha"
        })
      },
    ];

    await conn.sendMessage(m.chat, {
      image: { url: random },
      caption: "💖 Random Trisha JKT48",
      footer: "Klik tombol untuk foto berikutnya",
      interactiveButtons: buttons,
      hasMediaAttachment: true
    }, { quoted: m });

  } catch (err) {
    console.log(err);
    m.reply("❌ Terjadi kesalahan: " + err.message);
  }
};

handler.help = ["trisha"];
handler.tags = ["jkt"];
handler.command = /^\.?trisha$/i;

export default handler;