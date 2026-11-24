FROM node:24.10.0-alpine

WORKDIR /app

COPY package.json package-lock.json* ./

RUN npm ci

COPY . .

RUN npm run build

# The action serves the OpenAI protocol itself, on AI_OPENAI_PORT (8080 by default).
EXPOSE 8080

CMD ["npm", "run", "start"]
