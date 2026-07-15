# Playwright's image ships Chromium + all system deps + Node 20.
FROM mcr.microsoft.com/playwright:v1.56.0-jammy

WORKDIR /app
ENV NODE_ENV=production
ENV PORT=5178

# Install runtime dependencies (tsx is a runtime dep).
COPY package*.json ./
RUN npm ci --omit=dev

# Install the Chromium build that exactly matches the installed Playwright version
# (the base image's OS deps stay; this just guarantees the browser revision matches).
RUN npx playwright install chromium chromium-headless-shell

# App source (fonts, public UI, src, scripts).
COPY . .

EXPOSE 5178
CMD ["node", "--import", "tsx", "src/server.ts"]
