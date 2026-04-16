import { toast } from "sonner";

export type AdminErrorBody = {
  error?: string;
  detail?: string;
  hint?: string;
  fields?: { path: string; message: string }[];
  errorId?: string;
};

export class AdminFetchError extends Error {
  status: number;
  detail?: string;
  hint?: string;
  fields?: { path: string; message: string }[];
  errorId?: string;

  constructor(message: string, status: number, body?: AdminErrorBody) {
    super(message);
    this.name = "AdminFetchError";
    this.status = status;
    this.detail = body?.detail;
    this.hint = body?.hint;
    this.fields = body?.fields;
    this.errorId = body?.errorId;
  }
}

/**
 * Thin wrapper around fetch that extracts the structured admin error payload
 * when a response is not OK.
 */
export async function adminFetch(
  input: RequestInfo | URL,
  init?: RequestInit
): Promise<Response> {
  const res = await fetch(input, init);
  if (res.ok) return res;

  let body: AdminErrorBody | undefined;
  try {
    body = (await res.clone().json()) as AdminErrorBody;
  } catch {
    // non-JSON response — keep body undefined
  }

  const message =
    body?.error ||
    (res.status === 401
      ? "로그인이 필요합니다"
      : res.status === 403
        ? "이 작업을 수행할 권한이 없어요"
        : res.status === 413
          ? "파일 또는 데이터 크기가 너무 커요"
          : res.status >= 500
            ? "서버에서 문제가 생겼어요"
            : "요청을 처리하지 못했어요");

  throw new AdminFetchError(message, res.status, body);
}

/**
 * Show a friendly toast describing the admin-side failure. Accepts any thrown
 * value and falls back to a generic message if it's not an AdminFetchError.
 */
export function toastAdminError(
  err: unknown,
  fallback = "요청을 처리하지 못했어요"
): void {
  if (err instanceof AdminFetchError) {
    const description = buildErrorDescription(err);
    toast.error(err.message, {
      description,
      duration: 8000,
    });
    return;
  }

  if (err instanceof Error) {
    toast.error(fallback, {
      description: err.message,
      duration: 6000,
    });
    return;
  }

  toast.error(fallback);
}

function buildErrorDescription(err: AdminFetchError): string | undefined {
  const lines: string[] = [];

  if (err.fields && err.fields.length > 0) {
    for (const field of err.fields.slice(0, 3)) {
      lines.push(`• ${field.path}: ${field.message}`);
    }
    if (err.fields.length > 3) {
      lines.push(`• 그 외 ${err.fields.length - 3}개 항목도 확인해주세요.`);
    }
  } else if (err.detail) {
    lines.push(err.detail);
  }

  if (err.hint) {
    lines.push(err.hint);
  }

  if (err.errorId) {
    lines.push(`오류 번호: ${err.errorId}`);
  }

  return lines.length > 0 ? lines.join("\n") : undefined;
}
