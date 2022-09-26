FROM node:14.20

ENV NODE_ENV=production

WORKDIR /app

RUN mkdir server
COPY ["./server/package.json", "./server/yarn.lock", "./"]
RUN yarn install --prod
COPY ./server .

COPY ./types ./vsordle-types
RUN cd ./vsordle-types && yarn install && yarn build && cd ..


RUN yarn add file:vsordle-types
RUN yarn build

EXPOSE 8080

CMD ["node", "dist/app.js"]