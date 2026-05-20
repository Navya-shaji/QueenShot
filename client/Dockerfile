# --- STAGE 1: BUILD ---
FROM node:20-alpine AS build

WORKDIR /app

# Copy lock files and install dependencies
COPY package*.json ./
RUN npm ci

# Copy codebase and compile
COPY . .
RUN npm run build

# --- STAGE 2: PRODUCTION SERVE ---
FROM nginx:stable-alpine

# Copy built files to Nginx public html directory
COPY --from=build /app/dist /usr/share/nginx/html

# Copy the custom Nginx server config
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
