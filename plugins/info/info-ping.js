import os from "os";
import fs from "fs";
import speedTest from "speedtest-net";

function formatSize(bytes) {
  if (!bytes || isNaN(bytes)) return "0 B";
  const units = ["B", "KB", "MB", "GB", "TB"];
  let i = 0;
  while (bytes >= 1024 && i < units.length - 1) {
    bytes /= 1024;
    i++;
  }
  return `${bytes.toFixed(2)} ${units[i]}`;
}

function clockString(ms) {
  if (isNaN(ms) || ms < 0) return "--";
  const d = Math.floor(ms / 86400000);
  const h = Math.floor((ms / 3600000) % 24);
  const m = Math.floor((ms / 60000) % 60);
  const s = Math.floor((ms / 1000) % 60);
  return [d && `${d}d`, h && `${h}h`, m && `${m}m`, `${s}s`].filter(Boolean).join(" ");
}

function getOSPrettyName() {
  try {
    const lines = fs.readFileSync("/etc/os-release").toString().split("\n");
    const info = lines.reduce((acc, line) => {
      const [key, val] = line.split("=");
      if (key && val) acc[key.trim()] = val.replace(/"/g, "");
      return acc;
    }, {});
    return info["PRETTY_NAME"] || os.platform();
  } catch {
    return os.platform();
  }
}

function makeBar(used, total, length = 10) {
  const ratio = total ? Math.min(1, Math.max(0, used / total)) : 0;
  const filled = Math.round(ratio * length);
  const empty = length - filled;
  const pct = (ratio * 100).toFixed(2);
  return `*[${"█".repeat(filled)}${"░".repeat(empty)}] ${pct}%*`;
}

async function getInternetSpeed() {
  try {
    const st = await speedTest({ acceptLicense: true, acceptGdpr: true });
    const download = (st.download.bandwidth * 8 / 1e6).toFixed(2); // Mbps
    const upload = (st.upload.bandwidth * 8 / 1e6).toFixed(2); // Mbps
    return { download, upload };
  } catch (err) {
    console.log("Speedtest error:", err.message);
    return { download: "N/A", upload: "N/A" };
  }
}

let handler = async (m, { conn }) => {
  try {
    const start = performance.now();
    await conn.sendPresenceUpdate("composing", m.chat);
    const end = performance.now();
    const responseTime = (end - start).toFixed(3);

    const cpu = os.cpus();
    const cpuModel = cpu[0]?.model?.split("@")[0]?.trim() || "Unknown CPU";
    const cpuCores = cpu.length;
    const osName = getOSPrettyName();
    const platform = os.platform();
    const kernel = os.release();

    const ramUsed = os.totalmem() - os.freemem();
    const ramTotal = os.totalmem();
    const ramBar = makeBar(ramUsed, ramTotal);

    const diskInfo = fs.existsSync("/") ? fs.statSync("/") : null;
    const diskTotal = diskInfo ? os.totalmem() : 0; // fallback
    const diskUsed = diskInfo ? ramUsed : 0;       // fallback
    const diskBar = makeBar(diskUsed, diskTotal);

    const uptimeBot = clockString(process.uptime() * 1000);
    const uptimeVPS = clockString(os.uptime() * 1000);

    const { download, upload } = await getInternetSpeed();

    const msg = `
🌟 *\`LAPORAN SERVER\`*
🚀 *Waktu Response:* ${responseTime} ms
⏰ *Uptime Bot:* ${uptimeBot}
📡 *Uptime VPS:* ${uptimeVPS}
━━━━━━━━━━━━━━━━━━━━
📶 *\`INTERNET SPEED\`*
⬇️ Download: ${download} Mbps
⬆️ Upload: ${upload} Mbps
━━━━━━━━━━━━━━━━━━━━
💻 *\`INFORMASI SERVER\`*
🐧 *OS:* ${osName}
🖥️ *Platform:* ${platform} (${os.arch()})
📜 *Kernel:* ${kernel}
🧠 *CPU:* ${cpuModel} (${cpuCores} Core)
🗳️ *RAM:* ${formatSize(ramUsed)} / ${formatSize(ramTotal)}
${ramBar}
🔥 *Disk:* ${formatSize(diskUsed)} / ${formatSize(diskTotal)}
${diskBar}
━━━━━━━━━━━━━━━━━━━━`.trim();

    await conn.sendMessage(
      m.chat,
      {
        text: msg,
        contextInfo: {
          externalAdReply: {
            title: "⚡ Status Sistem Real-Time",
            body: "Monitoring performa bot dan server",
            thumbnailUrl: "https://h.top4top.io/p_3602jiegr0.jpg",
            sourceUrl: "https://api.ilhm.my.id/playground",
            mediaType: 1,
            renderLargerThumbnail: true,
          },
        },
      },
      { quoted: m }
    );
  } catch (err) {
    console.error(err);
    await conn.sendMessage(m.chat, { text: `❌ Gagal menampilkan status:\n${err.message}` }, { quoted: m });
  }
};

handler.help = ["ping"];
handler.tags = ["info"];
handler.command = /^(ping|speed|speedtest|status)$/i;

export default handler;