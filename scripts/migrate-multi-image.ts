// Historical PostgreSQL runner. SQL dialects must never be mixed.
throw new Error("PostgreSQL migrations are archived. Use wrangler d1 migrations apply DB --local; production requires an explicit --remote target.");
export {};
