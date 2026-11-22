# Production image. esbuild (installed with tsx) bundles the app and resolves
# the "@/..." path aliases, which plain tsc output would leave unresolved.
FROM node:26-alpine AS build

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npx --no-install tsc --noEmit -p tsconfig.json
RUN npx --no-install esbuild src/server.ts --bundle --platform=node --target=node22 \
   --packages=external --sourcemap --outfile=dist/server.js

FROM node:26-alpine

ENV NODE_ENV=production
WORKDIR /app

COPY package*.json ./
RUN npm ci --omit=dev && npm cache clean --force

COPY --from=build /app/dist ./dist

USER node
EXPOSE 3000

CMD ["node", "--enable-source-maps", "dist/server.js"]
