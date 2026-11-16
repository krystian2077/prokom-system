FROM node:22-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --omit=dev

FROM node:22-alpine AS builder
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
ARG NEXT_PUBLIC_API_URL
ARG NEXT_PUBLIC_SITE_URL
ARG NEXT_PUBLIC_GOOGLE_CLIENT_ID
# Optional: Umami analytics (empty ID = no script), NEXT_PUBLIC_TECH_SW=0 = service worker kill
# switch, CSP report endpoint, draft frames (staging only, never production). BUILD_DATE = sitemap lastModified.
ARG NEXT_PUBLIC_UMAMI_WEBSITE_ID
ARG NEXT_PUBLIC_UMAMI_SRC
ARG NEXT_PUBLIC_TECH_SW
ARG NEXT_PUBLIC_CSP_REPORT_URI
ARG NEXT_PUBLIC_TECH_DRAFT
ARG BUILD_DATE
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL \
    NEXT_PUBLIC_SITE_URL=$NEXT_PUBLIC_SITE_URL \
    NEXT_PUBLIC_GOOGLE_CLIENT_ID=$NEXT_PUBLIC_GOOGLE_CLIENT_ID \
    NEXT_PUBLIC_UMAMI_WEBSITE_ID=$NEXT_PUBLIC_UMAMI_WEBSITE_ID \
    NEXT_PUBLIC_UMAMI_SRC=$NEXT_PUBLIC_UMAMI_SRC \
    NEXT_PUBLIC_TECH_SW=$NEXT_PUBLIC_TECH_SW \
    NEXT_PUBLIC_CSP_REPORT_URI=$NEXT_PUBLIC_CSP_REPORT_URI \
    NEXT_PUBLIC_TECH_DRAFT=$NEXT_PUBLIC_TECH_DRAFT \
    BUILD_DATE=$BUILD_DATE
RUN npm run build

FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
# next/image in standalone needs sharp: `npm ci` on alpine installs the musl build
# (@img/sharp-linuxmusl-*), the standalone trace copies it; the path makes it explicit.
ENV NEXT_SHARP_PATH=/app/node_modules/sharp
# Runs as the image's `node` user, not root. The app files stay root-owned (read-only for the
# process); only .next/cache (next/image optimizer, ISR) must be writable.
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
RUN mkdir -p .next/cache && chown -R node:node .next/cache
USER node

EXPOSE 3000
CMD ["node", "server.js"]
