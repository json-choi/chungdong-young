import { S3Client } from "@aws-sdk/client-s3";

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
  const extension = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp", "image/gif": "gif" }[file.type];
  if (!extension) throw new Error("Unsupported image type");
  const key = `announcements/${crypto.randomUUID()}.${extension}`;
  const url = r2PublicUrl(key);
  const { env } = await import("cloudflare:workers");
  await env.MEDIA.put(key, await file.arrayBuffer(), {
    httpMetadata: { contentType: file.type, cacheControl: "public, max-age=31536000, immutable" },
  });
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
  const keys = new Set(refs.map(r2KeyFromReference).filter((key): key is string => key !== null));
  // Legacy Blob objects remain intact for rollback. Only this app's R2 prefix is mutable.
  if (keys.size) {
    const { env } = await import("cloudflare:workers");
    await env.MEDIA.delete([...keys]);
  }
}
