import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/server/auth/auth";
import { requireAdmin } from "@/server/auth/guard";
import { z } from "zod/v4";
import { adminApiError, AdminApiError } from "@/server/api/errors";

const passwordSchema = z.object({
  currentPassword: z.string().min(1, "현재 비밀번호를 입력해주세요"),
  newPassword: z.string().min(8, "새 비밀번호는 8자 이상이어야 합니다"),
});

export async function POST(request: NextRequest) {
  await requireAdmin();

  try {
    const body = await request.json();
    const parsed = passwordSchema.parse(body);

    try {
      await auth.api.changePassword({
        body: {
          currentPassword: parsed.currentPassword,
          newPassword: parsed.newPassword,
        },
        headers: request.headers,
      });
    } catch (err) {
      // Preserve the original error so the log captures the full stack while
      // showing admins a non-technical explanation.
      const original = err instanceof Error ? err : new Error(String(err));
      throw new AdminApiError("현재 비밀번호가 올바르지 않습니다", {
        status: 400,
        detail: "지금 사용 중인 비밀번호가 입력한 값과 달라요.",
        hint: "현재 비밀번호를 다시 확인한 뒤 시도해주세요.",
        cause: original,
      });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    return adminApiError(err, "auth.password");
  }
}
