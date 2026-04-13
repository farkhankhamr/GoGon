# Step 1: Build the client
FROM node:18-slim AS client-builder
WORKDIR /app/client
COPY client/package*.json ./
RUN npm install
COPY client/ .
RUN npm run build

# Step 2: Build the server
FROM node:18-slim
WORKDIR /app
COPY server/package*.json ./
RUN npm install --production
COPY server/ .

# Copy client build to server's public directory
COPY --from=client-builder /app/client/dist ./public

# Expose port 7860
EXPOSE 7860
ENV PORT=7860

CMD ["node", "src/index.js"]
