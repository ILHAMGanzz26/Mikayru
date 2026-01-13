// lib/uploader-ilhm.js
import fs from "fs";
import path from "path";
import fetch from "node-fetch";
import FormData from "form-data";

const BASE = "https://ilhm.my.id"; // domain upload

/**
 * Upload buffer ke ilhm.my.id
 * @param {Buffer} buffer - Buffer media
 * @param {string} mime - MIME type
 * @returns {Promise<string>} URL hasil upload
 */
export async function uploadIlhm(buffer, mime = "application/octet-stream") {
  if (!buffer?.length) throw new Error("Buffer kosong.");

  // simpan temporer
  let ext = mime.split("/")[1] || "bin";
  let tempPath = path.join(".", `upload_${Date.now()}.${ext}`);
  fs.writeFileSync(tempPath, buffer);

  const form = new FormData();
  form.append("file", fs.createReadStream(tempPath));

  const res = await fetch(`${BASE}/api/upload/`, {
    method: "POST",
    body: form,
    headers: form.getHeaders(),
  });

  let text = await res.text().catch(() => "");
  let data = {};
  try {
    data = text ? JSON.parse(text) : {};
  } catch {
    data = { raw: text };
  }

  // hapus temporer
  try { fs.unlinkSync(tempPath) } catch {}

  // ambil URL dari response
  let url = null;
  if (data.url && typeof data.url === "string") url = data.url.startsWith("http") ? data.url : BASE + data.url;
  if (!url && data.storedName) url = `${BASE}/uploads/${data.storedName}`;
  if (!url && data.originalName) url = `${BASE}/uploads/${data.originalName}`;
  if (!url && data.filename) url = `${BASE}/uploads/Image/${data.filename}`;
  if (!url) throw new Error(`Response tidak mengandung URL.\n${JSON.stringify(data, null, 2)}`);

  return url;
}