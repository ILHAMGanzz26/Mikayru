let handler = async (m, { conn }) => {
    let vcard = `BEGIN:VCARD
VERSION:3.0
N:;ttname;;;
FN:ttname
item1.TEL;waid=14695659146:+1 (469) 565-9146
item1.X-ABLabel:Ponsel
END:VCARD`;
    let qkontak = {
        key: {
            fromMe: false,
            participant: "14695659146@s.whatsapp.net",
            remoteJid: "status@broadcast",
        },
        message: {
            contactMessage: {
                displayName: "Meta Ai",
                vcard,
            },
        },
    };

    await conn.sendMessage(
        m.chat,
        {
            image: { url: "https://k.top4top.io/p_35603varr0.jpg" },
            caption:
                "🍙 *Project Script ILHAM A.* 🍙\n" +
                "📂 *Repository: Source code resmi Mikayru*\n" +
                "✨ *Jangan lupa kasih ⭐ di repo kalau suka ya!*",
            title: "🍡 Mikayru — WhatsApp Bot",
            subtitle: "",
            footer: "*© 2024 – 2025 ILHAM A.*\n*All Rights Reserved*",
            interactiveButtons: [
                {
                    name: "cta_url",
                    buttonParamsJson: JSON.stringify({
                        display_text: "🌐 GitHub Repo",
                        url: "https://github.com/",
                        merchant_url: "https://github.com/",
                    }),
                },
                {
                    name: "cta_url",
                    buttonParamsJson: JSON.stringify({
                        display_text: "🐛 Report Issue",
                        url: "https://github.com/",
                        merchant_url: "https://github.com/",
                    }),
                },
                {
                    name: "cta_url",
                    buttonParamsJson: JSON.stringify({
                        display_text: "🔧 Pull Request",
                        url: "https://github.com/",
                        merchant_url: "https://github.com/",
                    }),
                },
            ],
            hasMediaAttachment: true,
        },
        { quoted: qkontak }
    );
};

handler.help = ["script"];
handler.tags = ["info"];
handler.command = /^(script|sc)$/i;

export default handler;
