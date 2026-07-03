# ---- build (Vite static bundle) ----
FROM node:22-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
# vite.config.ts requires PORT + BASE_PATH at config-load time (even for build).
ENV PORT=5173
ENV BASE_PATH=/
ENV NODE_ENV=production
RUN npm run build   # -> dist/public

# ---- runtime (nginx: static + /api reverse proxy to the backend) ----
FROM nginx:1.27-alpine AS runtime
# The official image runs envsubst over *.template at startup. Restrict it to our
# vars so nginx runtime vars ($host, $uri, ...) are left untouched.
ENV NGINX_ENVSUBST_FILTER=^(PORT|BACKEND_URL|BACKEND_HOST)$
ENV PORT=8080
COPY --from=build /app/dist/public /usr/share/nginx/html
COPY nginx.default.conf.template /etc/nginx/templates/default.conf.template
EXPOSE 8080
