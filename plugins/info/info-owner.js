let handler = async (m, { conn }) => {
    let vcard = `BEGIN:VCARD
VERSION:3.0
FN:ɪʟʜᴀᴍ ᴀ.
ORG:ɪʟʜᴀɴ ᴀ.
TITLE:Metatron Executioner of Michael
EMAIL;type=INTERNET:illhamadiyastaa@gmail.com
TEL;type=CELL;waid=62882008364516:+62882008364516
ADR;type=WORK:;;2-chōme-7-5 Fuchūchō;ILHM;Osaka;594-0071;Japan
URL;type=WORK:https://www.instagram.com/
X-WA-BIZ-NAME:ɪʟʜᴀᴍ ᴀ.
X-WA-BIZ-DESCRIPTION:𝐓𝐡𝐞 𝐃𝐞𝐯𝐞𝐥𝐨𝐩𝐞𝐫 𝐎𝐟 𝐌𝐢𝐤𝐚𝐲𝐫𝐮
X-WA-BIZ-HOURS:Mo-Su 00:00-23:59
END:VCARD`;

    let qkontak = {
        key: { fromMe: false, participant: "0@s.whatsapp.net", remoteJid: "status@broadcast" },
        message: { contactMessage: { displayName: "𝗜𝗟𝗛𝗔𝗠 𝗔.", vcard } },
    };

    await conn.sendMessage(
        m.chat,
        {
            contacts: { displayName: "𝗜𝗟𝗛𝗔𝗠 𝗔.", contacts: [{ vcard }] },
            contextInfo: {
                externalAdReply: {
                    title: "Copyright © 2025 - 2026 Mikayru",
                    body: "Hubungi langsung lewat WhatsApp",
                    thumbnailUrl: "https://k.top4top.io/p_35603varr0.jpg",
                    mediaType: 1,
                    renderLargerThumbnail: true,
                },
            },
        },
        { quoted: qkontak }
    );
    let team = global.config.owner.filter(([num]) => num !== "62882008364516");
    if (team.length) {
        let vcards = team.map(([num, name]) => ({
            vcard: `BEGIN:VCARD
VERSION:3.0
FN:${name}
TEL;type=CELL;waid=${num}:${num}
END:VCARD`,
        }));

        await conn.sendMessage(
            m.chat,
            {
                contacts: {
                    displayName: "Mikayru Team",
                    contacts: vcards,
                },
            },
            { quoted: qkontak }
        );
    }
};

handler.help = ["owner"];
handler.tags = ["info"];
handler.command = /^(owner|creator)$/i;

export default handler;
