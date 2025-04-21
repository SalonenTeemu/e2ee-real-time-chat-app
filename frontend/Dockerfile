FROM node:23-alpine

WORKDIR /app

COPY package.json ./
RUN npm ci

COPY . .

CMD ["npm", "run", "dev"]
