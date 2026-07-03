# ---- deps ----
FROM node:22-alpine AS deps
WORKDIR /app
COPY package*.json ./
RUN npm ci

# ---- build ----
FROM node:22-alpine AS build
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1
# NEXT_PUBLIC_* vars are inlined at build time - pass the public site URL here.
ARG NEXT_PUBLIC_SITE_URL=http://localhost:5173
ENV NEXT_PUBLIC_SITE_URL=$NEXT_PUBLIC_SITE_URL
# next.config rewrites() runs at build time and bakes the /api proxy destination
# into the route manifest, so the backend URL must be present during `next build`.
ARG API_URL=http://localhost:4000
ENV API_URL=$API_URL
RUN npm run build

# ---- runtime ----
FROM node:22-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
# Next standalone server honours PORT/HOSTNAME; Cloud Run injects PORT (8080).
ENV HOSTNAME=0.0.0.0
COPY --from=build /app/public ./public
COPY --from=build /app/.next/standalone ./
COPY --from=build /app/.next/static ./.next/static
EXPOSE 3000
# API_URL (the Fastify backend) is read at server start by next.config.mjs rewrites.
CMD ["node", "server.js"]
