FROM node:20-alpine AS base
RUN npm install -g pnpm@11.5.1

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
COPY --from=deps /app/apps/employee/node_modules ./apps/employee/node_modules
COPY . .
RUN pnpm --filter @orbyatravel/employee build

FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production
RUN addgroup --system --gid 1001 nodejs && adduser --system --uid 1001 nextjs
COPY --from=builder /app/apps/employee/public ./apps/employee/public
COPY --from=builder --chown=nextjs:nodejs /app/apps/employee/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/apps/employee/.next/static ./apps/employee/.next/static
USER nextjs
EXPOSE 3002
ENV PORT=3002
CMD ["node", "apps/employee/server.js"]
