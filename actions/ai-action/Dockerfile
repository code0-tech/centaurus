FROM node:24-alpine

WORKDIR /app

COPY code0-tech-* ./

COPY package.json package-lock.json tsconfig.base.json turbo.json ./

COPY actions/ai ./actions/ai-action

RUN npm ci

WORKDIR /app/actions/ai-action

RUN npm run build


CMD ["npm", "run", "start", "-w", "@code0-tech/ai-action"]