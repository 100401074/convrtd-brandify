# Playwright's image ships Chromium + all system deps + Node 20.
FROM mcr.microsoft.com/playwright:v1.56.0-jammy

WORKDIR /app
ENV NODE_ENV=production
ENV PORT=5178

# Install runtime dependencies (tsx is a runtime dep; browsers are already in the image).
COPY package*.json ./
RUN npm ci --omit=dev

# App source (fonts, public UI, src, scripts).
COPY . .

EXPOSE 5178
CMD ["node", "--import", "tsx", "src/server.ts"]
