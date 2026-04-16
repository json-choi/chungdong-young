import { NextRequest, NextResponse } from "next/server";
import { db } from "@/server/db/client";
import { user } from "@/server/db/schema";
import { auth } from "@/server/auth/auth";
import { z } from "zod/v4";
import { count, eq } from "drizzle-orm";
import { adminApiError, AdminApiError } from "@/server/api/errors";

const registerSchema = z.object({
  name: z.string().min(1, "이름을 입력해주세요"),
  email: z.email("올바른 이메일을 입력해주세요"),
  password: z.string().min(8, "비밀번호는 8자 이상이어야 합니다"),
  setupKey: z.string().min(1, "셋업 키를 입력해주세요"),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = registerSchema.parse(body);

    if (!process.env.ADMIN_SETUP_KEY) {
      throw new AdminApiError("서버에 ADMIN_SETUP_KEY 환경변수가 설정되지 않았습니다", {
        status: 500,
        detail: "배포 환경의 환경변수를 확인해주세요.",
      });
    }

    if (parsed.setupKey !== process.env.ADMIN_SETUP_KEY) {
      throw new AdminApiError("셋업 키가 일치하지 않습니다", {
        status: 403,
        detail: "환경변수 ADMIN_SETUP_KEY 와 동일한 값을 입력해주세요.",
      });
    }

    const [{ value: userCount }] = await db
      .select({ value: count() })
      .from(user);

    if (userCount > 0) {
      throw new AdminApiError("이미 관리자 계정이 존재하여 신규 등록이 차단되었습니다", {
        status: 403,
        detail: "최초 관리자는 DB에 계정이 0개일 때만 등록할 수 있습니다.",
      });
    }

    let newUser: Awaited<ReturnType<typeof auth.api.signUpEmail>>;
    try {
      newUser = await auth.api.signUpEmail({
        body: {
          name: parsed.name,
          email: parsed.email,
          password: parsed.password,
        },
      });
    } catch (err) {
      const original = err instanceof Error ? err : new Error(String(err));
      throw new AdminApiError("계정을 만들지 못했습니다", {
        status: 400,
        detail: "이메일 형식이 잘못되었거나 이미 사용 중일 수 있어요.",
        hint: "다른 이메일 또는 더 강한 비밀번호로 다시 시도해주세요.",
        cause: original,
      });
    }

    // Set admin role
    await db
      .update(user)
      .set({ role: "admin" })
      .where(eq(user.id, newUser.user.id));

    return NextResponse.json(
      { user: { id: newUser.user.id, email: newUser.user.email } },
      { status: 201 }
    );
  } catch (err) {
    return adminApiError(err, "auth.register");
  }
}
