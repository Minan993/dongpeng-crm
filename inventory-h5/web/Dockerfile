FROM node:20-alpine
ARG NPM_REGISTRY=https://registry.npmmirror.com
WORKDIR /app
COPY package.json ./
RUN npm config set registry ${NPM_REGISTRY} \
  && npm install
COPY src ./src
COPY index.html ./
RUN npm run build
EXPOSE 4173
HEALTHCHECK NONE
CMD ["npm", "run", "start"]
