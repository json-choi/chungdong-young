import { NextRequest, NextResponse } from "next/server";
import { verifyPassword } from "better-auth/crypto";
import { and, eq } from "drizzle-orm";
import { z } from "zod/v4";
import { db } from "@/server/db/client";
import { user, account } from "@/server/db/schema";
import { getAdminSession, unauthorizedResponse } from "@/server/auth/guard";
import { adminApiError, AdminApiError } from "@/server/api/errors";

const emailSchema = z.object({
  newEmail: z
    .string()
    .trim()
    .email("올바른 이메일을 입력해주세요")
    .transform((value) => value.toLowerCase()),
  currentPassword: z.string().min(1, "현재 비밀번호를 입력해주세요"),
});

export async function POST(request: NextRequest) {
  const session = await getAdminSession();
  if (!session) return unauthorizedResponse();

  try {
    const body = await request.json();
    const parsed = emailSchema.parse(body);
    const currentEmail = session.user.email.toLowerCase();

    if (parsed.newEmail === currentEmail) {
      throw new AdminApiError("현재 이메일과 동일합니다", {
        status: 400,
        detail: "변경하려면 다른 이메일 주소를 입력해주세요.",
      });
    }

    const [credentialAccount] = await db
      .select({
        id: account.id,
        accountId: account.accountId,
        password: account.password,
      })
      .from(account)
      .where(
        and(
          eq(account.userId, session.user.id),
          eq(account.providerId, "credential")
        )
      )
      .limit(1);

    if (!credentialAccount?.password) {
      throw new AdminApiError("이메일 로그인 계정을 찾을 수 없습니다", {
        status: 404,
        detail: "현재 세션이 이메일/비밀번호 방식으로 로그인되어 있지 않을 수 있습니다.",
      });
    }

    const isPasswordValid = await verifyPassword({
      hash: credentialAccount.password,
      password: parsed.currentPassword,
    });

    if (!isPasswordValid) {
      throw new AdminApiError("현재 비밀번호가 올바르지 않습니다", {
        status: 400,
        detail: "비밀번호를 다시 확인하고 입력해주세요.",
      });
    }

    const existing = await db
      .select({ id: user.id })
      .from(user)
      .where(eq(user.email, parsed.newEmail))
      .limit(1);

    if (existing.length > 0 && existing[0].id !== session.user.id) {
      throw new AdminApiError("이미 사용 중인 이메일입니다", {
        status: 409,
        detail: `${parsed.newEmail} 은(는) 다른 계정에 등록되어 있습니다.`,
      });
    }

    const now = new Date();

    await db.transaction(async (tx) => {
      await tx
        .update(user)
        .set({ email: parsed.newEmail, updatedAt: now })
        .where(eq(user.id, session.user.id));

      // Legacy installs may use the email itself as the credential accountId.
      if (credentialAccount.accountId.toLowerCase() === currentEmail) {
        await tx
          .update(account)
          .set({ accountId: parsed.newEmail, updatedAt: now })
          .where(eq(account.id, credentialAccount.id));
      }
    });

    return NextResponse.json({
      success: true,
      email: parsed.newEmail,
    });
  } catch (err) {
    return adminApiError(err, "auth.email");
  }
}
