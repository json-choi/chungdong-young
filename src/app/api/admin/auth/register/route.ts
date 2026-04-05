import { NextRequest, NextResponse } from "next/server";
import { db } from "@/server/db/client";
import { user } from "@/server/db/schema";
import { auth } from "@/server/auth/auth";
import { z } from "zod/v4";
import { count, eq } from "drizzle-orm";

const registerSchema = z.object({
  name: z.string().min(1, "이름을 입력해주세요"),
  email: z.email("올바른 이메일을 입력해주세요"),
  password: z.string().min(8, "비밀번호는 8자 이상이어야 합니다"),
  setupKey: z.string().min(1),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = registerSchema.parse(body);

    if (parsed.setupKey !== process.env.ADMIN_SETUP_KEY) {
      return NextResponse.json(
        { error: "Invalid setup key" },
        { status: 403 }
      );
    }

    const [{ value: userCount }] = await db
      .select({ value: count() })
      .from(user);

    if (userCount > 0) {
      return NextResponse.json(
        { error: "Registration is closed" },
        { status: 403 }
      );
    }

    const newUser = await auth.api.signUpEmail({
      body: {
        name: parsed.name,
        email: parsed.email,
        password: parsed.password,
      },
    });

    // Set admin role
    await db
      .update(user)
      .set({ role: "admin" })
      .where(eq(user.id, newUser.user.id));

    return NextResponse.json(
      { user: { id: newUser.user.id, email: newUser.user.email } },
      { status: 201 }
    );
  } catch {
    return NextResponse.json(
      { error: "등록에 실패했습니다" },
      { status: 422 }
    );
  }
}
