import { NextResponse } from "next/server";
import { ZodError } from "zod/v4";

export type FieldIssue = { path: string; message: string };

export type AdminErrorBody = {
  error: string;
  detail?: string;
  hint?: string;
  fields?: FieldIssue[];
  errorId?: string;
};

export class AdminApiError extends Error {
  status: number;
  detail?: string;
  hint?: string;
  fields?: FieldIssue[];

  constructor(
    message: string,
    options: {
      status?: number;
      detail?: string;
      hint?: string;
      fields?: FieldIssue[];
      cause?: unknown;
    } = {}
  ) {
    super(message, options.cause !== undefined ? { cause: options.cause } : undefined);
    this.name = "AdminApiError";
    this.status = options.status ?? 400;
    this.detail = options.detail;
    this.hint = options.hint;
    this.fields = options.fields;
  }
}

function shortId(): string {
  return Math.random().toString(36).slice(2, 8).toUpperCase();
}

// Map internal schema field names to user-friendly Korean labels so
// validation messages make sense to non-developer admins.
const FIELD_LABELS: Record<string, string> = {
  title: "제목",
  bodyHtml: "본문",
  linkUrl: "링크 주소",
  priority: "우선순위",
  startAt: "게시 시작일시",
  endAt: "게시 종료일시",
  eventStartAt: "행사 시작일시",
  eventEndAt: "행사 종료일시",
  isAllDay: "하루 종일 여부",
  isPublished: "게시 여부",
  showOnFeed: "피드 노출",
  showOnCalendar: "달력 노출",
  imageUrls: "이미지",
  imageBlobPaths: "이미지 경로",
  imageAspect: "이미지 비율",
  imageFit: "이미지 맞춤",
  imageFocals: "이미지 초점",
  newEmail: "새 이메일",
  currentPassword: "현재 비밀번호",
  newPassword: "새 비밀번호",
  email: "이메일",
  password: "비밀번호",
  name: "이름",
  setupKey: "셋업 키",
  items: "항목 목록",
  id: "항목 ID",
};

function humanizePath(path: readonly PropertyKey[]): string {
  if (path.length === 0) return "요청 내용";
  return path
    .map((segment) => {
      if (typeof segment === "number") return `${segment + 1}번째`;
      if (typeof segment === "symbol") return segment.description ?? "(필드)";
      return FIELD_LABELS[segment] ?? segment;
    })
    .join(" › ");
}

function rawPath(path: readonly PropertyKey[]): string {
  return path
    .map((segment) =>
      typeof segment === "symbol"
        ? (segment.description ?? "symbol")
        : String(segment)
    )
    .join(".");
}

function buildFieldIssues(err: ZodError): FieldIssue[] {
  return err.issues.map((issue) => ({
    path: humanizePath(issue.path),
    message: issue.message,
  }));
}

type PgErrorLike = { code?: string; detail?: string; message?: string };

function isPgError(err: unknown): err is PgErrorLike {
  if (!err || typeof err !== "object") return false;
  const maybeCode = (err as { code?: unknown }).code;
  return typeof maybeCode === "string" && /^[0-9A-Z]{5}$/.test(maybeCode);
}

function describeDatabaseError(err: PgErrorLike): {
  error: string;
  detail?: string;
  hint?: string;
} {
  switch (err.code) {
    case "23505":
      return {
        error: "같은 값이 이미 저장되어 있습니다",
        detail: "중복되면 안 되는 항목에 같은 값이 있어서 저장하지 못했어요.",
        hint: "값을 조금 바꿔서 다시 시도해주세요.",
      };
    case "23503":
      return {
        error: "연결된 데이터가 없어 저장할 수 없습니다",
        detail: "이미 삭제되었거나 존재하지 않는 항목을 참조하고 있습니다.",
        hint: "페이지를 새로고침한 뒤 다시 시도해주세요.",
      };
    case "23502":
      return {
        error: "필수 입력 항목이 비어 있습니다",
        detail: "반드시 채워야 하는 칸 중 비어 있는 것이 있어요.",
        hint: "빨간 표시가 있는 칸을 채워서 다시 저장해주세요.",
      };
    case "23514":
      return {
        error: "허용되지 않는 값이라 저장할 수 없습니다",
        detail: "입력하신 값이 허용 범위를 벗어났습니다.",
        hint: "값을 확인한 뒤 다시 시도해주세요.",
      };
    case "22001":
      return {
        error: "입력한 내용이 너무 깁니다",
        detail: "글자 수 제한을 초과했어요.",
        hint: "내용을 조금 줄여서 다시 저장해주세요.",
      };
    case "22P02":
      return {
        error: "숫자 또는 날짜 형식이 올바르지 않습니다",
        detail: "입력하신 값이 숫자나 날짜로 인식되지 않았어요.",
        hint: "형식을 다시 확인해주세요.",
      };
    default:
      return {
        error: "데이터베이스에서 요청을 처리하지 못했습니다",
        detail: "잠시 뒤 다시 시도해주세요.",
      };
  }
}

function isNetworkLikeError(err: Error): boolean {
  const name = err.name.toLowerCase();
  const message = err.message.toLowerCase();
  return (
    name === "fetcherror" ||
    name === "aborterror" ||
    message.includes("fetch failed") ||
    message.includes("econnrefused") ||
    message.includes("timeout") ||
    message.includes("network")
  );
}

type LogDiagnostics = Record<string, unknown>;

function baseDiagnostics(err: unknown): LogDiagnostics {
  if (err instanceof Error) {
    return {
      errorName: err.name,
      errorMessage: err.message,
      errorStack: err.stack,
      errorCause:
        err.cause instanceof Error
          ? { name: err.cause.name, message: err.cause.message }
          : err.cause,
    };
  }
  return { errorValue: err };
}

function logAdminError(
  context: string | undefined,
  errorId: string,
  status: number,
  kind: string,
  err: unknown,
  extra?: LogDiagnostics
): void {
  const payload: LogDiagnostics = {
    errorId,
    context: context ?? "unknown",
    kind,
    status,
    timestamp: new Date().toISOString(),
    ...baseDiagnostics(err),
    ...(extra ?? {}),
  };

  const tag = context ? `[admin:${context}]` : "[admin]";
  // Serialize to a single JSON line so Vercel log search can match by `errorId`.
  console.error(`${tag} ${errorId} ${kind}`, payload);
}

/**
 * Normalize any thrown value into a friendly admin-facing JSON response.
 * Messages target non-developer admins, so avoid stack traces and jargon.
 * Every failure emits a structured server log line tagged with `errorId` so
 * we can jump straight to the stack trace when a user reports the ID.
 */
export function adminApiError(err: unknown, context?: string): NextResponse {
  const errorId = shortId();

  if (err instanceof AdminApiError) {
    logAdminError(context, errorId, err.status, "AdminApiError", err, {
      detail: err.detail,
      hint: err.hint,
      fields: err.fields,
    });
    return NextResponse.json<AdminErrorBody>(
      {
        error: err.message,
        detail: err.detail,
        hint: err.hint,
        fields: err.fields,
        errorId,
      },
      { status: err.status }
    );
  }

  if (err instanceof ZodError) {
    const fields = buildFieldIssues(err);
    const first = fields[0];
    logAdminError(context, errorId, 422, "ZodValidation", err, {
      issues: err.issues.map((issue) => ({
        path: rawPath(issue.path),
        code: issue.code,
        message: issue.message,
      })),
    });
    return NextResponse.json<AdminErrorBody>(
      {
        error: first
          ? `${first.path} 항목을 확인해주세요`
          : "입력하신 내용에 문제가 있어요",
        detail: first ? first.message : undefined,
        hint:
          fields.length > 1
            ? `이 외에도 ${fields.length - 1}개 항목을 더 확인해주세요.`
            : "입력칸을 확인한 뒤 다시 저장해주세요.",
        fields,
        errorId,
      },
      { status: 422 }
    );
  }

  if (err instanceof SyntaxError) {
    logAdminError(context, errorId, 400, "SyntaxError", err);
    return NextResponse.json<AdminErrorBody>(
      {
        error: "요청 형식이 올바르지 않습니다",
        detail: "페이지가 예상과 다른 형태로 데이터를 보냈어요.",
        hint: "페이지를 새로고침한 뒤 다시 시도해주세요.",
        errorId,
      },
      { status: 400 }
    );
  }

  if (isPgError(err)) {
    const described = describeDatabaseError(err);
    logAdminError(context, errorId, 400, "DatabaseError", err, {
      pgCode: err.code,
      pgDetail: err.detail,
    });
    return NextResponse.json<AdminErrorBody>(
      { ...described, errorId },
      { status: 400 }
    );
  }

  if (err instanceof Error && isNetworkLikeError(err)) {
    logAdminError(context, errorId, 503, "NetworkError", err);
    return NextResponse.json<AdminErrorBody>(
      {
        error: "외부 서비스와 통신하지 못했습니다",
        detail:
          "이미지 저장소나 인증 서버에 일시적으로 연결이 안 됐을 수 있어요.",
        hint: "잠시 후 다시 시도해주세요. 계속 같은 오류가 나면 관리자에게 문의해주세요.",
        errorId,
      },
      { status: 503 }
    );
  }

  logAdminError(context, errorId, 500, "UnhandledError", err);
  return NextResponse.json<AdminErrorBody>(
    {
      error: "예상치 못한 오류가 발생했습니다",
      detail:
        "문제를 잠시 후 다시 시도해주세요. 계속 같은 오류가 나면 아래 오류 번호를 알려주시면 빠르게 도와드릴 수 있어요.",
      errorId,
    },
    { status: 500 }
  );
}
