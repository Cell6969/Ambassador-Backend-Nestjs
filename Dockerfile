FROM node:15.4

# SET DIRECTORY
WORKDIR /app
# COPY PACKAGE.json
COPY package.json .
# RUN npm install
RUN npm install
# Copy all file
COPY . .
# RUN cmd
CMD ["npm", "run", "start"]

