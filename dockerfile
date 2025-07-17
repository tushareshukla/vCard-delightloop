# Use official Node.js 20 LTS image
FROM node:20

# Set working directory
WORKDIR /app

# Accept build arguments for environment variables
ARG NEXT_PUBLIC_API_BASE_URL
ARG MONGODB_URI
ARG STRIPE_SECRET_KEY
ARG SENDGRID_API_KEY

# Set environment variables for build process
ENV NEXT_PUBLIC_API_BASE_URL=$NEXT_PUBLIC_API_BASE_URL
ENV MONGODB_URI=$MONGODB_URI
ENV STRIPE_SECRET_KEY=$STRIPE_SECRET_KEY
ENV SENDGRID_API_KEY=$SENDGRID_API_KEY

# Only copy dependency manifests first (for better layer caching)
COPY package.json pnpm-lock.yaml* ./

# Install pnpm and dependencies
RUN npm install -g pnpm && pnpm install --frozen-lockfile

# Copy rest of the code (after installing deps, so cache works)
COPY . .

# Debug: Print environment variables during build
RUN echo "Build-time NEXT_PUBLIC_API_BASE_URL: $NEXT_PUBLIC_API_BASE_URL"

RUN pnpm build

# Expose Next.js default port
EXPOSE 3000

# Start the production server
CMD ["pnpm", "start"]