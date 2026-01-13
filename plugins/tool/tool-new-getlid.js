let handler = async (m, { conn, text }) => {
    try {
        await global.loading(m, conn)

        const input =
            m.mentionedJid?.[0] ||
            m.quoted?.sender ||
            (text && /^\d+$/.test(text) ? text + "@s.whatsapp.net" : null)

        if (!input) {
            return m.reply(
                "Format:\n" +
                "- Mention user\n" +
                "- Reply pesan\n" +
                "- Ketik nomor (contoh: 62812xxxx)"
            )
        }

        let lid

        if (/@lid$/.test(input)) {
            lid = input.replace(/@lid$/, "")
        } else {
            const raw = await conn.signalRepository?.lidMapping?.getLIDForPN(input)
            if (!raw) return m.reply("LID tidak ditemukan untuk user tersebut.")
            lid = raw.replace(/@lid$/, "")
        }

        const result = `
\`\`\`[LID RESOLVE • OK]\`\`\`

• *Target*
${input}

• *Linked ID*
${lid}

• *Source*
signalRepository

• *Time*
Realtime
`.trim()

        await conn.sendMessage(
            m.chat,
            { text: result },
            { quoted: m }
        )

    } catch (e) {
        conn.logger?.error?.(e)
        m.reply(`Error: ${e.message}`)
    } finally {
        await global.loading(m, conn, true)
    }
}

handler.help = ["getlid"]
handler.tags = ["tools"]
handler.command = /^getlid$/i

export default handler