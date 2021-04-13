FROM node:15

# Create app directory
WORKDIR /usr/src/app

# Bundle app source
COPY . .

# Install app dependencies
RUN npm install

EXPOSE 3000

# Run built app
CMD [ "node", "build" ] 
