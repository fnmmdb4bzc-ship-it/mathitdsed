FROM node:22-alpine

WORKDIR /app

# Built from the repo root (see docker-compose.yml) so the migrations below,
# which now live with the Netlify Database ones, are inside the build context.
COPY backend/package.json ./
RUN npm install --omit=dev

COPY backend/src ./src
# One source of truth: Netlify applies these at deploy, the compose API
# applies the same files at start-up.
COPY netlify/database/migrations ./migrations

ENV NODE_ENV=production
EXPOSE 3000

CMD ["node", "src/server.js"]
