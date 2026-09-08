import { DeleteObjectCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { del, put } from "@vercel/blob";

function required(name: string): string {
  const value = process.env[name]?.trim();
  if (!value || value === "[SENSITIVE]") throw new Error(`${name} is not configured`);
  return value;
}

export function r2Client() {
  return new S3Client({
    region: "auto",
    endpoint: `https://${required("R2_ACCOUNT_ID")}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: required("R2_ACCESS_KEY_ID"),
      secretAccessKey: required("R2_SECRET_ACCESS_KEY"),
    },
  });
}

export function r2PublicUrl(key: string) {
  const base = new URL(required("R2_PUBLIC_URL").replace(/\/$/, "") + "/");
  if (base.protocol !== "https:") throw new Error("R2_PUBLIC_URL must use HTTPS");
  return new URL(key.split("/").map(encodeURIComponent).join("/"), base).href;
}

export async function uploadImage(file: File) {
  // Explicit rollback mode keeps the same application usable on Vercel.
  if (process.env.IMAGE_STORAGE_PROVIDER === "vercel") {
    return put(`announcements/${Date.now()}-${file.name}`, file, { access: "public" });
  }
  const extension = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp", "image/gif": "gif" }[file.type];
  if (!extension) throw new Error("Unsupported image type");
  const key = `announcements/${crypto.randomUUID()}.${extension}`;
  const url = r2PublicUrl(key);
  await r2Client().send(new PutObjectCommand({
    Bucket: required("R2_BUCKET_NAME"), Key: key,
    Body: new Uint8Array(await file.arrayBuffer()), ContentType: file.type,
    CacheControl: "public, max-age=31536000, immutable",
  }));
  return { url, pathname: `r2:${key}` };
}

export function r2KeyFromReference(ref: string): string | null {
  let key: string;
  if (ref.startsWith("r2:")) key = ref.slice(3);
  else {
    const configured = process.env.R2_PUBLIC_URL;
    if (!configured) return null;
    const prefix = configured.replace(/\/$/, "") + "/";
    if (!ref.startsWith(prefix)) return null;
    key = decodeURIComponent(ref.slice(prefix.length));
  }
  if (!key.startsWith("announcements/") || key.includes("..") || /[\\?#\u0000-\u001f]/.test(key)) {
    throw new Error("Invalid image object key");
  }
  return key;
}

export async function deleteImages(refs: string[]) {
  const keys = new Set<string>();
  const legacy = new Set<string>();
  for (const ref of refs) {
    const key = r2KeyFromReference(ref);
    if (key) keys.add(key);
    else if (/^announcements\//.test(ref) || /^https:\/\/[^/]+\.public\.blob\.vercel-storage\.com\//.test(ref)) legacy.add(ref);
  }
  if (keys.size) {
    const client = r2Client();
    for (const Key of keys) await client.send(new DeleteObjectCommand({ Bucket: required("R2_BUCKET_NAME"), Key }));
  }
  if (legacy.size) await del([...legacy]);
}
