FROM node:latest

WORKDIR /src

COPY . .

RUN npm install

CMD ["node", "./src/rest.js"]
