FROM node:15

# Create app directory
WORKDIR /usr/src/app

# Bundle app source
COPY . .

# Install app dependencies
RUN npm install

# Build on the newer node image
RUN npm run build

EXPOSE 3000
CMD [ "node", "build" ]
