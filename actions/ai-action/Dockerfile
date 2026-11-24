FROM node:24.10.0-alpine

WORKDIR /app

COPY package.json package-lock.json* ./

# Pins npm to the version package.json declares, so the lock is read by the
# same npm that wrote it.
RUN corepack enable npm

RUN npm ci

COPY . .

RUN npm run build

# The action serves the OpenAI protocol itself, on AI_OPENAI_PORT (8080 by default).
EXPOSE 8080

CMD ["npm", "run", "start"]
