FROM node:20-alpine

WORKDIR /app

COPY package.json ./
COPY server/package.json ./server/
COPY client/package.json ./client/

RUN npm install --omit=dev && cd server && npm install --omit=dev && cd ../client && npm install

COPY . .

RUN cd client && npm run build

EXPOSE 3001

CMD ["npm", "start"]
