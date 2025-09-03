FROM node:20-alpine AS build
WORKDIR /app

# Install dependencies (cache layer)
COPY package.json package-lock.json* .npmrc* ./
RUN npm ci --no-audit --no-fund

# Copy source and build
COPY . .
RUN npm run build

FROM node:20-alpine AS runner
WORKDIR /app

# Copy only what we need to run
COPY --from=build /app/package.json ./package.json
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist

ENV NODE_ENV=production
# Fly will set PORT. Default to 8080 for local runs.
ENV PORT=8080

EXPOSE 8080

CMD ["npm", "run", "start"]

