# Stage 1: Build frontend
FROM node:22-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npx prisma generate
RUN npm run build

# Stage 2: Production
FROM node:22-alpine
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3006

COPY package*.json ./
RUN npm ci
COPY prisma ./prisma
RUN npx prisma generate

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/server ./server

EXPOSE 3006

CMD ["npx", "tsx", "server/index.ts"]
