let handler = async (m, { conn, text, usedPrefix, command }) => {
    if (!text) {
        return m.reply(`Contoh:\n${usedPrefix + command} apa itu CRUD`)
    }

    await global.loading(m, conn)

    try {
        const request = (url, parser, options = {}) =>
            new Promise(async (resolve, reject) => {
                try {
                    const res = await fetch(url, {
                        timeout: 12000,
                        ...options
                    })
                    const json = await res.json()
                    const result = parser(json)
                    if (!result) return reject("Invalid")
                    resolve(result)
                } catch {
                    reject("Failed")
                }
            })

        const apis = [

            request(
                `https://api.mifinfinity.my.id/api/ai/Copilot-gpt5?q=${encodeURIComponent(text)}`,
                d => d?.response?.text
            ),

            request(
                `https://ftaka.qzz.io/gpt-4?prompt=${encodeURIComponent(text)}`,
                d => d?.message
            ),

            request(
                `https://api.elrayyxml.web.id/api/ai/chatgpt?text=${encodeURIComponent(text)}`,
                d => d?.result
            ),

            request(
                `https://api.ootaizumi.web.id/ai/ai-4-chat?text=${encodeURIComponent(text)}`,
                d => d?.message
            ),

            request(
                `https://api.zenzxz.my.id/api/ai/gpt?question=${encodeURIComponent(text)}&prompt=${encodeURIComponent(text)}`,
                d => d?.results
            ),

            request(
                `https://anabot.my.id/api/ai/chatgpt?prompt=${encodeURIComponent(text)}&apikey=freeApikey`,
                d => d?.data?.result?.chat
            )

        ]

        const result = await new Promise((resolve, reject) => {
            let finished = false
            let failed = 0

            for (let api of apis) {
                api.then(res => {
                    if (finished) return
                    finished = true
                    resolve(res)
                }).catch(() => {
                    failed++
                    if (failed === apis.length) {
                        reject("ALL_FAILED")
                    }
                })
            }
        })

        await m.reply(result)

    } catch {
        await m.reply("❌ Semua API AI sedang bermasalah, silakan coba lagi nanti.")
    } finally {
        await global.loading(m, conn, true)
    }
}

handler.help = ["ai <pertanyaan>"]
handler.tags = ["ai"]
handler.command = /^(ai)$/i

export default handler