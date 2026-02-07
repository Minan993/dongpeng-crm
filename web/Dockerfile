FROM node:20-alpine AS builder
ENV TZ=Asia/Shanghai
WORKDIR /app
RUN npm config set registry https://registry.npmmirror.com
COPY package.json vite.config.js index.html ./
COPY src ./src
RUN npm install && npm run build

FROM nginx:1.27-alpine
ENV TZ=Asia/Shanghai
COPY --from=builder /app/dist /usr/share/nginx/html

COPY nginx.conf /etc/nginx/conf.d/default.conf
