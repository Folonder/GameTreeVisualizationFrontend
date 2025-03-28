# Use a more specific and lighter Node.js image
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Copy package files first to leverage Docker caching
COPY package*.json ./

# Install dependencies
RUN npm ci 

# Copy only necessary files, consider using .dockerignore
COPY . .

# Set ownership of the application files to the node user
RUN chown -R node:node /app

# Expose the port
EXPOSE 5001

# Switch to non-root user
USER node

# Start the application
CMD ["npm", "start"]