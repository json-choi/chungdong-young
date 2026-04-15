import { NextRequest, NextResponse } from "next/server";
import { verifyPassword } from "better-auth/crypto";
import { and, eq } from "drizzle-orm";
import { z } from "zod/v4";
import { db } from "@/server/db/client";
import { user, account } from "@/server/db/schema";
import { getAdminSession, unauthorizedResponse } from "@/server/auth/guard";

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

  const body = await request.json();
  const parsedResult = emailSchema.safeParse(body);
  if (!parsedResult.success) {
    return NextResponse.json(
      { error: parsedResult.error.issues[0]?.message ?? "입력값이 올바르지 않습니다" },
      { status: 422 }
    );
  }

  const parsed = parsedResult.data;
  const currentEmail = session.user.email.toLowerCase();

  if (parsed.newEmail === currentEmail) {
    return NextResponse.json(
      { error: "현재 이메일과 동일합니다" },
      { status: 400 }
    );
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
    return NextResponse.json(
      { error: "이메일 로그인 계정을 찾을 수 없습니다" },
      { status: 404 }
    );
  }

  const isPasswordValid = await verifyPassword({
    hash: credentialAccount.password,
    password: parsed.currentPassword,
  });

  if (!isPasswordValid) {
    return NextResponse.json(
      { error: "현재 비밀번호가 올바르지 않습니다" },
      { status: 400 }
    );
  }

  const existing = await db
    .select({ id: user.id })
    .from(user)
    .where(eq(user.email, parsed.newEmail))
    .limit(1);

  if (existing.length > 0 && existing[0].id !== session.user.id) {
    return NextResponse.json(
      { error: "이미 사용 중인 이메일입니다" },
      { status: 409 }
    );
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
}
