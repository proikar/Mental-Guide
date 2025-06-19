FROM node:20 AS build

WORKDIR /app

COPY package*.json ./

RUN npm install

COPY . .

RUN npm run build

FROM node:20

RUN npm install -g serve

COPY --from=build /app/build /app/build

WORKDIR /app

EXPOSE 3000

CMD ["npm", "start"]
