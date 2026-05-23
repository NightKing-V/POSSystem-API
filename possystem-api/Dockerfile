# Stage 1: Build the application
FROM node:24-alpine AS builder

WORKDIR /app

# Copy package files and install dependencies
COPY package*.json ./
RUN npm install

# Copy the rest of the code and build it
COPY . . 
RUN npm run build

# Stage 2: Run the application
FROM node:20-alpine

WORKDIR /app

# Copy only the production dependencies and the built files
COPY package*.json ./
RUN npm install --only=production

COPY --from=builder /app/dist ./dist

# Expose the port NestJS typically runs on
EXPOSE 3000

# Start the server
CMD ["node", "dist/main"]