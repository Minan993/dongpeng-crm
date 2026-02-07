FROM node:20-alpine
ENV TZ=Asia/Shanghai
WORKDIR /app
RUN npm config set registry https://registry.npmmirror.com
COPY package.json ./
RUN npm install --omit=dev
COPY src ./src
EXPOSE 3000
CMD ["npm","start"]
