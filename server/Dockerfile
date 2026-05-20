FROM node:20-alpine

WORKDIR /app

# Copy dependency configs
COPY package*.json ./

# Install only production dependencies
RUN npm ci --only=production

# Copy server code
COPY src ./src

EXPOSE 4000

ENV NODE_ENV=production

CMD ["node", "src/index.js"]
