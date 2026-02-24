FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm config set registry https://registry.npmmirror.com && npm install --production
COPY . .
EXPOSE 3000
CMD ["sh", "-c", "node src/db-init.js && node src/server.js"]
