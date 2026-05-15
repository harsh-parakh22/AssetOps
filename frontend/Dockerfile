# ─── Stage 1: Build Angular ───────────────────────────────────
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./

# Use npm install (works with or without package-lock.json)
RUN npm install --legacy-peer-deps

# Copy source
COPY . .

# Build production bundle
RUN npm run build

# ─── Stage 2: Serve with Nginx ────────────────────────────────
FROM nginx:1.27-alpine AS runtime

# Copy custom nginx config
COPY nginx.conf /etc/nginx/nginx.conf

# Copy built Angular app (Angular 18 outputs to browser/ subfolder)
COPY --from=builder /app/dist/assetops-frontend/browser /usr/share/nginx/html

# Cloud Run uses PORT env
ENV PORT=80
EXPOSE $PORT

HEALTHCHECK --interval=30s --timeout=5s \
  CMD wget -qO- http://localhost:$PORT/health || exit 1

CMD ["nginx", "-g", "daemon off;"]
