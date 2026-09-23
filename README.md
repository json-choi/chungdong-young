# 정동 젊은이 교회

Next.js application hosted on Cloudflare Workers with D1 for application data and R2 for announcement images.

## Local development

Install dependencies with `pnpm install`, then run `pnpm dev`. Set `BETTER_AUTH_SECRET`, `BETTER_AUTH_URL`, and `R2_PUBLIC_URL` for the local environment. See `.env.example` for the variable names.

## Production deployment

The [Cloudflare deployment workflow](.github/workflows/cloudflare.yml) builds and deploys each push to `main`. It uses the `cloudflare-production` GitHub environment and verifies the production page and its static assets at `https://chungdong.notish.cloud/`.

The Worker, D1 database, R2 bucket, KV namespace, and route are defined in [`wrangler.jsonc`](wrangler.jsonc). Deployments require the workflow's `CLOUDFLARE_API_TOKEN` secret and `CLOUDFLARE_ACCOUNT_ID`, `NEXT_PUBLIC_BETTER_AUTH_URL`, and `R2_PUBLIC_URL` variables.
