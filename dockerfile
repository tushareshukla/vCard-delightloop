FROM node:20

WORKDIR /app

# Install pnpm and dependencies
COPY package.json pnpm-lock.yaml ./
RUN npm install -g pnpm && pnpm install --frozen-lockfile

# Copy rest of the app source
COPY . .

# Set environment for production
ENV NODE_ENV=production

# Build your Next.js app
RUN pnpm build

EXPOSE 3000

CMD ["pnpm", "start"]
