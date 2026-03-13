FROM node:20-alpine AS builder

WORKDIR /app
ENV HUSKY=0

COPY package.json yarn.lock ./
RUN yarn install --frozen-lockfile

COPY tsconfig.json ./
COPY src ./src

RUN yarn build

FROM node:20-alpine AS runner

WORKDIR /app
ENV NODE_ENV=production
ENV HUSKY=0

COPY package.json yarn.lock ./
RUN yarn install --frozen-lockfile --production=true

COPY --from=builder /app/dist ./dist

EXPOSE 3000

CMD ["node", "dist/server.js"]
