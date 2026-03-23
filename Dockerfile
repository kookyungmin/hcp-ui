# 1. build stage
FROM node:22-alpine AS builder

WORKDIR /app

# 의존성 먼저
COPY package*.json ./
RUN npm ci

# 소스 복사
COPY . ./

# Next build
RUN npm run build

# 2. run stage
FROM node:22-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

# standalone 결과만 복사
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

EXPOSE 3000

CMD ["node", "server.js"]
