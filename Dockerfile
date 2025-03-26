# Stage 1: Build the React application
FROM node:18-alpine AS build

WORKDIR /app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy the rest of the application code
COPY . .

# Update the API URL for production
RUN sed -i 's|http://localhost:5002/api|/api|g' src/services/api.js
RUN sed -i 's|http://localhost:5002/api|/api|g' .env

# Build the application
RUN npm run build

# Stage 2: Serve the application with Nginx
FROM nginx:alpine

# Copy the build from the previous stage
COPY --from=build /app/build /usr/share/nginx/html

# Copy custom Nginx config
COPY nginx-frontend.conf /etc/nginx/conf.d/default.conf

# Expose port 80
EXPOSE 80

# Start Nginx server
CMD ["nginx", "-g", "daemon off;"]