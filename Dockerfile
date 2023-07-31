FROM node:18

WORKDIR /stack

COPY packages packages/
COPY stacks stacks/
COPY package.json .
COPY package-lock.json .
COPY sst.config.ts .
COPY tsconfig.json .

RUN npm install