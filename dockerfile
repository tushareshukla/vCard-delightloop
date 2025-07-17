# Use official Node.js 20 LTS image
FROM node:20

# Set working directory
WORKDIR /app

# Only copy dependency manifests first (for better layer caching)
COPY package.json pnpm-lock.yaml* ./

# Install pnpm and dependencies
RUN npm install -g pnpm && pnpm install --frozen-lockfile

# Copy rest of the code (after installing deps, so cache works)
COPY . .

# Set production environment
ENV NODE_ENV=production

# Build Next.js app
RUN pnpm build

# Expose Next.js default port
EXPOSE 3000

# Start the production server
CMD ["pnpm", "start"]
