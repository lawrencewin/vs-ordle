FROM node:14.20-alpine

WORKDIR /app
COPY ["./client/package.json", "./client/yarn.lock", "./"],
RUN yarn install --prod
COPY ./client .
COPY ./types ./vsordle-types
RUN cd vsordle-types && yarn install && yarn build && cd ..
RUN yarn add file:vsordle-types && yarn build

FROM nginx:alpine
COPY --from=0 /app/build /usr/share/nginx/html
COPY --from=0 /app/nginx/nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 3000
