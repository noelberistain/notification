FROM node:10.15.3-alpine as notification001
WORKDIR /notification
COPY package*.json ./
RUN npm install
COPY . .
CMD [ "npm","start" ]
EXPOSE 5001