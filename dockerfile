FROM node:20

WORKDIR /app

COPY . .
RUN rm -rf node_modules

# Disable Corepack prompts
ENV COREPACK_ENABLE_PROMPT=0

# Enable pnpm via Corepack
RUN npm install -g pnpm \
    && pnpm config set allow-scripts true \
    && pnpm install


EXPOSE 3000

CMD ["pnpm", "dev"]
