# --- Stage 1: Build Frontend ---
FROM node:24-alpine AS frontend-builder
WORKDIR /app/frontend

COPY shared/ /app/shared/
COPY frontend/package*.json ./
RUN npm ci

COPY frontend/ ./
RUN npm run build

# --- Stage 2: Build Backend & Production Runner ---
FROM node:24-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000
ENV HOST=0.0.0.0

# Copy shared modules and dictionary data
COPY shared/ /app/shared/
COPY dictionary/ /app/dictionary/

# Install backend dependencies
WORKDIR /app/backend
COPY backend/package*.json ./
RUN npm ci

# Copy backend source
COPY backend/ ./

# Copy built frontend assets into frontend/dist for Express static serving
COPY --from=frontend-builder /app/frontend/dist /app/frontend/dist

EXPOSE 3000

# Start unified game server with tsx
CMD ["npx", "tsx", "src/server.ts"]
