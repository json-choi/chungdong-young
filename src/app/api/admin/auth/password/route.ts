import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/server/auth/auth";
import { requireAdmin } from "@/server/auth/guard";
import { z } from "zod/v4";

const passwordSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(8, "새 비밀번호는 8자 이상이어야 합니다"),
});

export async function POST(request: NextRequest) {
  await requireAdmin();

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

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json(
      { error: "현재 비밀번호가 올바르지 않습니다" },
      { status: 400 }
    );
  }
}
