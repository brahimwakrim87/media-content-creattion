FROM node:20-alpine

WORKDIR /app

RUN apk add --no-cache libc6-compat

COPY frontend/package*.json ./
RUN npm ci

COPY frontend/ .

EXPOSE 3000

CMD ["npm", "run", "dev"]
