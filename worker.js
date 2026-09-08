import handler from "vinext/server/fetch-handler";

export default {
  fetch(request, env, ctx) {
    if (env.MIGRATION_MAINTENANCE === "1") {
      return new Response("서비스 이전 중입니다. 잠시 후 다시 이용해 주세요.", {
        status: 503,
        headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "no-store", "Retry-After": "60" },
      });
    }
    return handler.fetch(request, env, ctx);
  },
};
