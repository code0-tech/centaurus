FROM node:24-alpine

WORKDIR /app

COPY package.json package-lock.json* ./

# Pins npm to the version package.json declares, so the lock is read by the
# same npm that wrote it.
RUN corepack enable npm

RUN npm ci

COPY . .

RUN npm run build

CMD ["npm", "run", "start"]
