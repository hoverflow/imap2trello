FROM node:carbon-alpine
WORKDIR /app
COPY package*.json ./
COPY . .
RUN apk --no-cache --virtual build-dependencies add \
    python \
    make \
    g++ \
    && npm install \
    && apk del build-dependencies
RUN npm install

CMD [ "npm", "start" ]