FROM node:20

WORKDIR /app

# Copy package files and install dependencies *before* copying all source code for better caching
COPY package.json pnpm-lock.yaml* ./
RUN npm install -g pnpm \
    && pnpm config set allow-scripts true \
    && pnpm install

# Now copy rest of the code
COPY . .

# Remove any local node_modules just in case
RUN rm -rf node_modules

# Build Next.js app
RUN pnpm build

EXPOSE 3000

# Run production server (Next.js)
CMD ["pnpm", "start"]
