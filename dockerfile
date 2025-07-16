FROM node:20

WORKDIR /app

COPY package.json ./

RUN npm install -g pnpm && pnpm install --no-frozen-lockfile

COPY . .

ENV NODE_ENV=production

RUN pnpm build

EXPOSE 3000

CMD ["pnpm", "start"]
