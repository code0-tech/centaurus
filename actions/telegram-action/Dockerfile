FROM node:24.10.0-alpine

WORKDIR /app

COPY package.json package-lock.json* ./

# Pins npm to the version package.json declares, so the lock is read by the
# same npm that wrote it.
RUN corepack enable npm

RUN npm ci

COPY . .

RUN npm run build

# The webhook server Telegram delivers updates to (TELEGRAM_WEBHOOK_PORT).
EXPOSE 8080

CMD ["npm", "run", "start"]
