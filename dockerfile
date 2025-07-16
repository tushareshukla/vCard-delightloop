# Use Node.js 20 LTS
FROM node:20

WORKDIR /app

# Copy only package manifests
COPY package.json pnpm-lock.yaml ./

# Install pnpm and dependencies (without requiring lockfile)
RUN npm install -g pnpm && pnpm install --no-frozen-lockfile

# Copy the rest of your source code—but exclude .env.local if present
COPY . .

# Set production environment
ENV NODE_ENV=production

# Build your Next.js app
RUN pnpm build

# Expose port
EXPOSE 3000

# Run your production server
CMD ["pnpm", "start"]
