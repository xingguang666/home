FROM node:20 AS builder
WORKDIR /app
COPY package*.json pnpm-lock.yaml* ./
RUN npm install
COPY . .
RUN [ ! -e ".env" ] && cp .env.example .env || true
RUN npm run build

FROM nginx:stable-alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
