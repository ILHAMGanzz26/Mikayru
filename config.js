import fs from "fs"
import path from "path"

const envPath = path.resolve(process.cwd(), ".env")
if (fs.existsSync(envPath)) {
  const lines = fs.readFileSync(envPath, "utf-8").split("\n")
  for (const line of lines) {
    if (!line || line.startsWith("#")) continue
    const [key, ...vals] = line.split("=")
    const value = vals.join("=").trim().replace(/^['"]|['"]$/g, "")
    if (key && !(key in process.env)) {
      process.env[key.trim()] = value
    }
  }
}

global.config = {
  /*============== STAFF ==============*/
  owner: [
        ["62882008364516", "𝙸𝙻𝙷𝙰𝙼 𝙰.", true],
        ["573178576560", "𝙼𝚒𝚔𝚊𝚢𝚛𝚞 𝚟:", false],
    ],
  newsletter: process.env.NEWSLETTER,
  group: process.env.GROUP,
  website: process.env.WEBSITE,

  /*========== DEVELOPER MODE ==========*/
  DEVELOPER: process.env.IS_IZUMI === "true",

  /*============= PAIRING =============*/
  pairingNumber: process.env.PAIRING_NUMBER,
  pairingAuth: process.env.PAIRING_AUTH === "true",

  /*============== API ==============*/
  APIs: {
    btz: process.env.API_BTZ,
  },
  APIKeys: {
    [process.env.API_BTZ]: process.env.APIKEY_BTZ,
  },

  /*============== MESSAGES ==============*/
    watermark: "𝙈͢𝙞𝙠𝙖𝙮𝙧𝙪 𝘽͢𝙤𝙩𝙯",
    author: "𝙄͢𝙇𝙃𝘼𝙈 𝘼.",
    stickpack: "𝙄𝙇𝙃𝘼𝙈 𝘼.",
    stickauth: "© 𝙈͢𝙞𝙠𝙖𝙮𝙧𝙪 𝘽͢𝙤𝙩𝙯",
}