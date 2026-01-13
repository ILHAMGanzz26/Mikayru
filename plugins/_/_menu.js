import os from "os";
import fs from "fs";

const defaultMenu = {
  before: `
┏━━━⪩ *INFO PENGGUNA* ⪨
┃ 👤 Nama   : %name
┃ 🧁 Status : %status
┗━━━━━━━━━━━━━━⟢

┏━━━⪩ *INFO PERINTAH* ⪨
┃ 🅐 = Admin
┃ 🅓 = Developer
┃ 🅞 = Owner
┗━━━━━━━━━━━━━━⟢
`.trimStart(),

  header: `
┏━━━⪩ %category ⪨
┃──────────────────`.trimStart(),

  body: `┃ ✦ %cmd %isAdmin %isMods %isOwner`,
  footer: `┗━━━━━━━━━━━━━━⟢`,

  after: `
🍰 *© ILHAM A. 2025*
`.trimStart(),
};

let handler = async (m, { conn, usedPrefix, command, isOwner, isMods, args }) => {
  try {
    await global.loading(m, conn);

    let teks = `${args[0] || ""}`.toLowerCase();
    let arrayMenu = [
      "all", "ai", "downloader", "group", "info", "internet",
      "maker", "owner", "islam", "server", "tools", "jkt"
    ];
    if (!arrayMenu.includes(teks)) teks = "404";

    const tags = {
      all: {
        ai: "🧠 AI Menu",
        downloader: "🍥 Downloader",
        group: "🧃 Grup",
        info: "📖 Info",
        internet: "💌 Internet",
        maker: "🎀 Maker",
        owner: "🪄 Owner",
        islam: "🍃 Islami",
        jkt: "🌿 JKT48",
        server: "🖥️ Server",
        tools: "🧸 Tools"
      },
      ai: { ai: "🧠 AI Menu" },
      downloader: { downloader: "🍥 Downloader" },
      group: { group: "🧃 Grup" },
      info: { info: "📖 Info" },
      internet: { internet: "💌 Internet" },
      maker: { maker: "🎀 Maker" },
      owner: { owner: "🪄 Owner" },
      islam: { islam: "🍃 Islami" },
      jkt: { jkt: "🌿 JKT48" },
      server: { server: "🖥️ Server" },
      tools: { tools: "🧸 Tools" }
    }[teks] || {};

    let name = conn.getName(m.sender);
    let status = isMods ? "🧁 Developer" : isOwner ? "🪄 Owner" : "🍬 Free User";
    let subtitle = `🕒 ${new Intl.DateTimeFormat("id-ID", {
      timeZone: "Asia/Jakarta",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false
    }).format(new Date())}`;

    const icons = ["🍓", "🍒", "🧁", "🍩", "🍪", "🍧", "🍡", "🍮", "🍫", "🍬", "🍭"];
    const totalf = Object.values(global.plugins)
      .filter(p => Array.isArray(p.help))
      .reduce((a, v) => a + v.help.length, 0);

    const lists = arrayMenu.map((v, i) => ({
      title: `${icons[i] || "⭐"} Menu ${capitalize(v)}`,
      description: `${icons[i] || "⭐"} Fitur ${v} siap dipakai 🚀`,
      id: `${usedPrefix + command} ${v}`
    }));

    const help = Object.values(global.plugins)
      .filter(p => !p.disabled)
      .map(p => ({
        help: Array.isArray(p.help) ? p.help : [p.help],
        tags: Array.isArray(p.tags) ? p.tags : [p.tags],
        admin: p.admin,
        owner: p.owner,
        mods: p.mods
      }));

    const _text = [
      defaultMenu.before.replace(/%name/g, name).replace(/%status/g, status),
      ...Object.keys(tags).map(tag => {
        return (
          defaultMenu.header.replace(/%category/g, tags[tag]) +
          "\n" +
          help
            .filter(p => p.tags.includes(tag))
            .map(p => {
              return p.help
                .map(h =>
                  defaultMenu.body
                    .replace(/%cmd/g, h)
                    .replace(/%isAdmin/g, p.admin ? "🅐" : "")
                    .replace(/%isMods/g, p.mods ? "🅓" : "")
                    .replace(/%isOwner/g, p.owner ? "🅞" : "")
                )
                .join("\n");
            })
            .join("\n") +
          "\n" +
          defaultMenu.footer
        );
      }),
      defaultMenu.after
    ].join("\n");

    // VCard Quote
    let vcard = `BEGIN:VCARD
VERSION:3.0
N:;ttname;;;
FN:ttname
item1.TEL;waid=14695659146:+1 (469) 565-9146
item1.X-ABLabel:Ponsel
END:VCARD`;

    let q = {
      key: {
        fromMe: false,
        participant: "14695659146@s.whatsapp.net",
        remoteJid: "status@broadcast"
      },
      message: {
        contactMessage: {
          displayName: "𝗠 𝗜 𝗞 𝗔 𝗬 𝗥 𝗨 - 𝗕 𝗢 𝗧",
          vcard
        }
      }
    };

    // 🎞️ Kirim video (GIF mode)
    await conn.sendMessage(
      m.chat,
      {
        video: { url: "https://c.top4top.io/m_3585ge3yz0.mp4" },
        gifPlayback: true,
        caption: _text,
        footer: global.config.author,
        contextInfo: {
          externalAdReply: {
            title: global.config.author,
            body: subtitle,
            mediaType: 1,
            sourceUrl: global.config.website
          }
        },
        interactiveButtons: [
          {
            name: "single_select",
            buttonParamsJson: JSON.stringify({
              title: "🌥️ Menu Lainnya ~",
              sections: [{ title: `📑 Fitur Bot Tersedia ${totalf}`, rows: lists }]
            })
          },
          {
            name: "quick_reply",
            buttonParamsJson: JSON.stringify({
              display_text: "🍧 Info Script",
              id: ".sc"
            })
          },
          {
            name: "cta_url",
            buttonParamsJson: JSON.stringify({
              display_text: "🎐 Kontak Owner",
              url: global.config.website,
              merchant_url: global.config.website
            })
          }
        ],
        hasMediaAttachment: true
      },
      { quoted: q }
    );

    // 🔊 Kirim Audio VN
    /*
    await conn.sendMessage(
      m.chat,
      {
        audio: { url: "https://tmpfiles.org/dl/5431867/file.mpeg" },
        mimetype: "audio/mpeg",
        ptt: true
      },
      { quoted: m }
    );
    */

  } finally {
    await global.loading(m, conn, true);
  }
}; 

handler.help = ["menu"];
handler.command = /^(menu|help)$/i;
export default handler;

function capitalize(word) {
  return word.charAt(0).toUpperCase() + word.slice(1);
}