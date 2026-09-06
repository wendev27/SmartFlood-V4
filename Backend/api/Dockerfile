FROM node:24-alpine

WORKDIR /app

COPY Backend/api/package*.json ./

RUN npm ci

COPY Backend/api/ ./

RUN npm run build

EXPOSE 5000

CMD ["npm", "start"]