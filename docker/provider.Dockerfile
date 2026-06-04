FROM node:20-alpine AS base
RUN corepack enable && corepack prepare pnpm@11.5.1 --activate

FROM base AS deps
WORKDIR /app
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./
COPY apps/web/package.json ./apps/web/
COPY apps/provider/package.json ./apps/provider/
COPY apps/employee/package.json ./apps/employee/
COPY apps/admin/package.json ./apps/admin/
COPY apps/api/package.json ./apps/api/
COPY packages/ui/package.json ./packages/ui/
COPY packages/types/package.json ./packages/types/
COPY packages/db/package.json ./packages/db/
COPY packages/config/package.json ./packages/config/
RUN pnpm install --frozen-lockfile

FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/apps/provider/node_modules ./apps/provider/node_modules
COPY . .
RUN pnpm --filter @orbyatravel/provider build

FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production
RUN addgroup --system --gid 1001 nodejs && adduser --system --uid 1001 nextjs
COPY --from=builder /app/apps/provider/public ./apps/provider/public
COPY --from=builder --chown=nextjs:nodejs /app/apps/provider/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/apps/provider/.next/static ./apps/provider/.next/static
USER nextjs
EXPOSE 3001
ENV PORT=3001
CMD ["node", "apps/provider/server.js"]
