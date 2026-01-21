# Base image
FROM node:20-alpine

# Set working directory
WORKDIR /app

# Copy package.json & package-lock.json
COPY package*.json ./

# Install dependencies
RUN npm ci

# Install PM2 globally
RUN npm install -g pm2

# Copy semua kode aplikasi
COPY . .

# Expose port sesuai aplikasi
EXPOSE 3008

# Start app with PM2
CMD ["pm2-runtime", "start", "npm", "--", "start"]
