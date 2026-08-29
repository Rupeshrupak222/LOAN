FROM node:20-alpine AS base
WORKDIR /app

# Prisma needs openssl
RUN apk add --no-cache openssl

COPY package*.json ./
COPY ../database/prisma ./prisma
RUN npm install

COPY . .
RUN npx prisma generate --schema ./prisma/schema.prisma
RUN npm run build

EXPOSE 4000
CMD ["node", "dist/server.js"]
