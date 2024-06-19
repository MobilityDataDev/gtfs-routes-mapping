FROM node:alpine

WORKDIR /gtfs-app

COPY package*.json ./

RUN npm install

COPY . .