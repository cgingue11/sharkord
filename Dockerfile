# Stage 1: Build the single-file executable (linux-x64 only)
FROM oven/bun:1 AS builder

WORKDIR /build

# Copy package files first for layer caching
COPY package.json bun.lock ./
COPY apps/server/package.json apps/server/
COPY apps/client/package.json apps/client/
COPY packages/shared/package.json packages/shared/
COPY packages/plugin-sdk/package.json packages/plugin-sdk/

RUN bun install

# Copy full source
COPY . .

# Build client + compile server binary for linux-x64
RUN cd apps/server && bun run build/docker-build.ts

# Stage 2: Minimal runtime image
FROM oven/bun:1-slim

COPY --from=builder /build/apps/server/build/out/sharkord-linux-x64 /sharkord

ENV RUNNING_IN_DOCKER=true

RUN chmod +x /sharkord

EXPOSE 4991/tcp
EXPOSE 40000/udp
EXPOSE 40000/tcp

CMD ["/sharkord"]
