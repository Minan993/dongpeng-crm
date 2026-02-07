FROM node:20-alpine
ARG NPM_REGISTRY=https://registry.npmmirror.com
WORKDIR /app
COPY package.json ./
RUN npm config set registry ${NPM_REGISTRY} \
  && npm install --omit=dev
COPY src ./src
EXPOSE 3000
CMD ["npm", "start"]
