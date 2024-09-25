# Dockerfile structure created with assistance from ChatGPT
# Use an official Node.js runtime as a parent image
FROM node:16

# Install ffmpeg
RUN apt-get update && apt-get install -y ffmpeg

# Set the working directory in the container
WORKDIR /usr/src/app

# Copy the package.json and package-lock.json files
COPY package*.json ./

# Install any needed dependencies
RUN npm install

# Copy the rest of the application code to the container
COPY . .

# Expose the port the app runs on
EXPOSE 3000

# Define the command to run your application
CMD ["node", "index.js"]