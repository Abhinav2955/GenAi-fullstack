FROM node:22-bookworm-slim
WORKDIR /app
ENV PUPPETEER_CACHE_DIR=/home/node/.cache/puppeteer
COPY package*.json ./
RUN npm install
COPY . .
USER node
EXPOSE 3000
CMD ["node","server.js"]
