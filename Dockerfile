# syntax=docker/dockerfile:1
FROM oven/bun:1
WORKDIR /app

# 1) install backend deps
COPY package.json ./
RUN bun install

# 2) copy frontend and build it
COPY frontend ./frontend
RUN cd frontend && bun install && bun run build

# 3) copy backend and move built frontend into server/public
COPY server ./server
RUN mkdir -p server/public && cp -r frontend/dist/* server/public/

# 4) run app
ENV NODE_ENV=production
EXPOSE 3000
CMD ["bun", "run", "server/index.ts"]

