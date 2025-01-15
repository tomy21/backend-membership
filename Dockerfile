FROM node:20-alpine

# Set the working directory
WORKDIR /app

# Copy package.json and yarn.lock (pastikan Anda menggunakan yarn.lock, bukan package-lock.json)
COPY package.json yarn.lock ./

# Install dependencies using Yarn
RUN yarn install

# Install PM2 globally
RUN npm install -g pm2

# Copy the rest of the application code
COPY . .

# Expose the application port
EXPOSE 3008

# Start the application using PM2
CMD ["pm2-runtime", "start", "yarn", "--", "start"]
