import { NextRequest, NextResponse } from "next/server";
import { put } from "@vercel/blob";
import { requireAdmin } from "@/server/auth/guard";
import { adminApiError, AdminApiError } from "@/server/api/errors";

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];
// Server accepts up to 10MB — browser compresses to WebP before upload so
// this should rarely be hit. Raw input on the client may be up to 15MB.
const MAX_SIZE = 10 * 1024 * 1024;

function formatMegabytes(bytes: number): string {
  return (bytes / (1024 * 1024)).toFixed(1);
}

export async function POST(request: NextRequest) {
  await requireAdmin();

  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      throw new AdminApiError("업로드할 파일이 전달되지 않았습니다", {
        status: 400,
        detail: "폼 필드 이름이 'file' 인지 확인해주세요.",
      });
    }

    if (!ALLOWED_TYPES.includes(file.type)) {
      throw new AdminApiError("지원하지 않는 이미지 형식입니다", {
        status: 400,
        detail: `업로드한 파일 형식: ${file.type || "(알 수 없음)"} · 허용 형식: JPEG, PNG, WebP, GIF`,
      });
    }

    if (file.size > MAX_SIZE) {
      throw new AdminApiError("파일 크기가 10MB를 초과했습니다", {
        status: 400,
        detail: `업로드한 파일: ${formatMegabytes(file.size)}MB · 최대 허용: ${formatMegabytes(MAX_SIZE)}MB`,
      });
    }

    const blob = await put(`announcements/${Date.now()}-${file.name}`, file, {
      access: "public",
    });

    return NextResponse.json({
      url: blob.url,
      pathname: blob.pathname,
    });
  } catch (err) {
    return adminApiError(err, "blob.upload");
  }
}
