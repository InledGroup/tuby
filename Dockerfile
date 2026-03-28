# Stage 1: Build everything
FROM node:20-slim AS builder
WORKDIR /app
COPY . .
RUN npm install
RUN cd frontend && npm run build
RUN cd backend && npm run build

# --- Stage 2: Runtime ---
FROM node:20-slim
WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    python3 \
    ffmpeg \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Install yt-dlp
RUN curl -L https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp -o /usr/local/bin/yt-dlp \
    && chmod a+rx /usr/local/bin/yt-dlp

# Create non-root user
RUN useradd -m appuser

# Copy only necessary files
COPY --from=builder --chown=appuser:appuser /app/frontend/dist ./frontend/dist
COPY --from=builder --chown=appuser:appuser /app/backend/dist ./backend/dist
COPY --from=builder --chown=appuser:appuser /app/backend/package.json ./backend/package.json
COPY --from=builder --chown=appuser:appuser /app/package.json ./package.json

# Install ONLY production dependencies in the final image
# We do this as root before switching to appuser
RUN npm install --omit=dev && chown -R appuser:appuser /app/node_modules

# Setup directories
RUN mkdir -p /tmp/youtuby && chown appuser:appuser /tmp/youtuby

USER appuser

# Set environment variables
ENV NODE_ENV=production
ENV PORT=4000
ENV DOWNLOAD_DIR=/tmp/youtuby

EXPOSE 4000

CMD ["node", "backend/dist/index.js"]
